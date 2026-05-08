"""PROPIQ AI — RAG Service (FAISS + Azure OpenAI)"""
import os
from typing import Optional
from app.config import settings


def _cloud_rag_enabled() -> bool:
    env = (settings.APP_ENV or "").strip().lower()
    return env in {"production", "prod", "staging", "azure"} and not settings.DEBUG


class RAGService:
    def __init__(self):
        self._vector_store = None
        self._qa_chain = None

    def _init_rag(self):
        """Initialize FAISS vector store from legal documents."""
        if self._qa_chain:
            return
        if not settings.AZURE_OPENAI_KEY or not _cloud_rag_enabled():
            return
        try:
            from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
            from langchain_community.vectorstores import FAISS
            from langchain.chains import RetrievalQA
            from langchain_community.document_loaders import PyPDFDirectoryLoader
            from langchain.text_splitter import RecursiveCharacterTextSplitter

            docs_dir = settings.LEGAL_DOCS_DIR
            faiss_path = settings.FAISS_INDEX_PATH

            embeddings = AzureOpenAIEmbeddings(
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_key=settings.AZURE_OPENAI_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                deployment=settings.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
            )

            # Load from saved index if exists
            if os.path.exists(faiss_path):
                self._vector_store = FAISS.load_local(faiss_path, embeddings,
                                                      allow_dangerous_deserialization=True)
            elif os.path.exists(docs_dir):
                loader = PyPDFDirectoryLoader(docs_dir)
                docs = loader.load()
                splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
                splits = splitter.split_documents(docs)
                self._vector_store = FAISS.from_documents(splits, embeddings)
                self._vector_store.save_local(faiss_path)
            else:
                return  # No documents yet

            retriever = self._vector_store.as_retriever(search_kwargs={"k": 5})
            llm = AzureChatOpenAI(
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_key=settings.AZURE_OPENAI_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                deployment_name=settings.AZURE_OPENAI_DEPLOYMENT,
                temperature=0.3,
            )
            self._qa_chain = RetrievalQA.from_chain_type(
                llm=llm, chain_type="stuff",
                retriever=retriever, return_source_documents=True,
            )
        except Exception as e:
            print(f"RAG init failed: {e}")

    async def query(self, query: str, document_type: Optional[str] = None) -> dict:
        self._init_rag()
        if not self._qa_chain:
            return {"answer": self._fallback(query), "sources": [], "confidence": "low"}
        try:
            result = self._qa_chain.invoke({"query": query})
            sources = [{"source": doc.metadata.get("source", ""), "page": doc.metadata.get("page", 0)}
                       for doc in result.get("source_documents", [])]
            return {"answer": result["result"], "sources": sources, "confidence": "high"}
        except Exception as e:
            return {"answer": self._fallback(query), "sources": [], "confidence": "low", "error": str(e)}

    def _fallback(self, query: str) -> str:
        query = query.lower()
        if "stamp duty" in query:
            return "In Telangana: Stamp Duty = 4%, Registration Fee = 0.5%, Transfer Duty = 1.5% of property value."
        if "encumbrance" in query:
            return "An Encumbrance Certificate (EC) lists all monetary transactions and liabilities against a property. Get it from the Sub-Registrar's office or Telangana registration portal."
        if "deed transfer" in query or "registration" in query:
            return "Deed transfer in Telangana takes 30-60 days. Required: Sale Deed, EC, Patta, Aadhar, PAN, stamp papers, and two witnesses."
        if "rera" in query:
            return "RERA Telangana is at rera.telangana.gov.in. Verify project registration before investing in any under-construction property."
        if "fsi" in query or "far" in query:
            return "FSI (Floor Space Index) / FAR determines how much built-up area is allowed on a plot. For HITEC City: FSI 4.0. Residential areas: typically 1.5-2.5."
        return "For accurate legal information, please consult a registered lawyer or visit the Telangana Registration department. I can answer from uploaded legal documents once configured."


rag_service = RAGService()
