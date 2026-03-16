# AGENTS.md

## Project Goal
Build a **document-grounded Q&A system** with:
- **Frontend:** TypeScript web UI.
- **Backend:** Python API + retrieval/LLM orchestration.
- **Domain behavior:** Users choose a counterparty, browse/upload that counterparty's documents (mostly PDFs), preview documents, and ask questions answered strictly from those documents.

---

## High-Level Product Requirements
1. Users can select a **counterparty** from the UI.
2. UI shows all documents associated with that counterparty.
3. Users can upload new documents for the selected counterparty.
4. Counterparty-document mapping is stored in a **CSV file**.
5. Users can preview documents in the UI.
6. Users can ask questions; backend answers using only that counterparty's documents.
7. Responses should include source grounding (at minimum: document name/page/chunk metadata where possible).

---

## Constraints and Guardrails
- Use **TypeScript** for frontend implementation.
- Use **Python** for backend implementation.
- Start simple; optimize for testability and incremental delivery.
- Prefer local, inspectable storage in early phases (CSV + local files).
- Keep retrieval scope restricted to the selected counterparty.
- If grounding is insufficient, backend should return an explicit "insufficient evidence" style response instead of hallucinating.

---

## Recommended Repository Structure (for future implementation)
- `frontend/` → TypeScript UI app
- `backend/` → Python API and retrieval pipeline
- `data/`
  - `counterparty_documents.csv`
  - `documents/<counterparty_id>/...`
- `docs/` → architecture and runbooks
- `tests/` → integration and end-to-end test assets

---

## Delivery Plan (Phased, Test-First)

### Phase 0 — Project Skeleton & Contracts
**Objective:** Define API contracts and data contracts before feature coding.

**Deliverables:**
- Agreed API endpoints and request/response schemas.
- CSV schema specification (required columns, validation rules).
- Counterparty/document identity conventions.
- Local run instructions.

**Validation checklist:**
- Can run frontend and backend independently.
- API contract document exists and is reviewed.
- Sample CSV passes schema checks.

---

### Phase 1 — Counterparty Selection + Document Listing (Read Path)
**Objective:** User selects a counterparty and sees associated documents from CSV.

**Deliverables:**
- UI: counterparty selector.
- Backend endpoint to list counterparties.
- Backend endpoint to list documents for selected counterparty from CSV.

**Validation checklist:**
- Selecting each counterparty refreshes list correctly.
- Empty-state behavior works for counterparties with no documents.
- CSV parsing errors are surfaced clearly.

---

### Phase 2 — Document Upload + CSV Mapping Update (Write Path)
**Objective:** Upload documents for selected counterparty and persist mapping in CSV.

**Deliverables:**
- UI upload flow bound to selected counterparty.
- Backend file storage and CSV append/update logic.
- Validation for file type/size and duplicate handling strategy.

**Validation checklist:**
- Uploaded file appears in storage and document list after refresh.
- CSV mapping updates are correct and durable.
- Invalid uploads return clear errors.

---

### Phase 3 — Document Preview in UI
**Objective:** Enable in-app preview for supported document formats (PDF first).

**Deliverables:**
- Secure backend endpoint for document retrieval/streaming.
- UI preview panel or modal for PDFs.
- Graceful fallback for unsupported previews.

**Validation checklist:**
- User can open/close preview for each listed document.
- Preview is constrained to selected counterparty authorization context.
- Large PDF handling is acceptable for target environment.

---

### Phase 4 — Retrieval Pipeline (Counterparty-Scoped)
**Objective:** Build ingestion + retrieval limited to selected counterparty docs.

**Deliverables:**
- PDF text extraction and chunking process.
- Embedding/index creation strategy.
- Retrieval API that filters strictly by counterparty.

**Validation checklist:**
- Retrieval returns relevant chunks for known queries.
- No cross-counterparty leakage in retrieval results.
- Re-index flow handles new uploads.

---

### Phase 5 — Question Answering API + UI Chat Experience
**Objective:** Deliver grounded Q&A flow end-to-end.

**Deliverables:**
- UI question input and answer display.
- Backend RAG orchestration: retrieve → prompt LLM → grounded response.
- Response includes citations/metadata.

**Validation checklist:**
- Answers are based on retrieved evidence.
- If evidence is missing, system says so explicitly.
- Citation metadata points to valid source documents/pages/chunks.

---

### Phase 6 — Reliability, Security, and Quality Hardening
**Objective:** Make the system robust for repeated use.

**Deliverables:**
- Input validation, logging, and error handling standards.
- Basic authN/authZ approach (at least environment-appropriate access control).
- Automated tests: unit + integration + selected e2e happy paths.
- Operational docs (backup, migration, reindex, troubleshooting).

**Validation checklist:**
- Test suite runs cleanly.
- Common failure modes are documented and recoverable.
- Data handling and access boundaries are reviewed.

---

## Definition of Done (Overall)
- Users can select counterparties, upload/preview documents, and ask grounded questions.
- Backend answers are restricted to selected counterparty documents.
- CSV mapping and file storage remain consistent after repeated operations.
- Core workflows are covered by automated tests and manual smoke checks.

---

## Execution Guidance for Future Agents
- Implement phases sequentially; do not skip acceptance checks.
- Keep each phase in a separate PR when possible.
- Prioritize observability and testability over early optimization.
- Any architecture deviation should be recorded in `docs/` with rationale.
