import logging
from pathlib import Path

from google import genai
from google.genai import types
from PyPDF2 import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DocumentChunk, Submission, VivaQuestion

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, db: AsyncSession):
        self.db = db
        # Attempt to init Gemini client
        try:
            self.client = genai.Client()
        except Exception as e:
            logger.warning("Could not initialize Gemini client. API key might be missing: %s", e)
            self.client = None

    async def index_submission_pdf(self, submission: Submission, pdf_path: str) -> None:
        """Extract text from PDF, chunk it, embed, and store in DB."""
        if not self.client:
            logger.error("Gemini client not initialized.")
            return

        # 1. Read PDF
        path = Path(pdf_path)
        if not path.exists():
            logger.error("PDF not found at %s", pdf_path)
            return

        reader = PdfReader(str(path))
        full_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"
        
        # 2. Naive Chunking (e.g. by paragraphs or fixed length)
        # For simplicity, split by chunks of ~1000 characters
        chunk_size = 1000
        chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]

        # 3. Embed chunks and save
        for chunk_text in chunks:
            response = self.client.models.embed_content(
                model="text-embedding-004",
                contents=chunk_text
            )
            embedding = response.embeddings[0].values
            
            chunk = DocumentChunk(
                submission_id=submission.id,
                content=chunk_text,
                embedding=embedding
            )
            self.db.add(chunk)
        
        await self.db.commit()
        logger.info("Indexed %d chunks for submission %s", len(chunks), submission.id)

    async def generate_viva_questions(self, submission: Submission, num_questions: int = 5) -> list[VivaQuestion]:
        """Generate viva questions using the submission text."""
        if not self.client:
            logger.error("Gemini client not initialized.")
            return []

        # Retrieve all chunks for this submission (for now, simply fetch all text)
        # In a larger system we might do a similarity search, but for a single lab report, 
        # the entire text fits easily into Gemini's context window.
        await self.db.refresh(submission, ["chunks"])
        if hasattr(submission, "chunks") and submission.chunks:
            context_text = "\n\n".join([chunk.content for chunk in submission.chunks])
        else:
            context_text = f"Aim: {submission.aim}\n\nCode:\n{submission.code}\n\nOutput:\n{submission.output}"

        prompt = f"""
        You are an expert examiner conducting a viva voce for a lab experiment.
        Based on the following lab report, generate {num_questions} thoughtful viva questions 
        that test the student's understanding of the code, theory, and output.
        Provide a short answer hint for each question.
        
        Format as JSON array with objects containing "question" and "hint" keys.
        
        Lab Report:
        {context_text}
        """

        response = self.client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        
        import json
        try:
            questions_data = json.loads(response.text)
            created_questions = []
            for q_data in questions_data:
                q = VivaQuestion(
                    submission_id=submission.id,
                    question_text=q_data.get("question", ""),
                    answer_hint=q_data.get("hint", "")
                )
                self.db.add(q)
                created_questions.append(q)
            
            await self.db.commit()
            for q in created_questions:
                await self.db.refresh(q)
            return created_questions
        except Exception:
            logger.exception("Failed to parse Gemini response: %s", response.text)
            return []
