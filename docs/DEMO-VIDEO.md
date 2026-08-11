# Verification demo video — single-take script (~4 min)

n8n review asks for an uncut ≤5-min recording covering: install from npm,
insert node, credential + test, main actions, and tool-use in an AI agent.
This script hits all five in order. Practice once off-camera; the take
itself is mechanical.

## Stage (already prepared, verify before recording)

- Clean n8n at **http://localhost:5679** (container `n8n-tamperlens-demo`,
  n8n 2.33.x) with the showcase corpus mounted at `/data/corpus`:
  `showcase-redaction-failed.pdf`, `showcase-br-comprovante-edited.pdf`,
  `showcase-br-comprovante-clean.pdf` — all fictional, engine-verified.
- Create the owner account BEFORE recording (it's a local throwaway; the
  signup screen wastes 40 s of the take).
- Have on a sticky note: your Tamperlens API key (tl_…) and your Anthropic
  API key (for the agent segment). They get pasted on camera into masked
  password fields — that is fine; don't display them anywhere else.
- Recording: QuickTime (⌘⇧5, record window) or Loom. One take, no cuts.
  Voiceover optional but n8n likes it; lines below.

## The take

**1 — Install (≈40 s).** Settings → Community nodes → Install →
`n8n-nodes-tamperlens@0.1.2` → accept the risk prompt → install.

> "Installing n8n-nodes-tamperlens, version 0.1.2 — the version submitted
> for verification. It has zero runtime dependencies."

**2 — Insert (≈20 s).** New workflow → add **Manual Trigger** → add
**Read/Write Files from Disk** (operation Read, file
`/data/corpus/showcase-redaction-failed.pdf`) → add **Tamperlens**
(operation Inspect Document; binary field `data` is the default).

> "Tamperlens reports structural fraud signals on documents — evidence,
> never an approve/deny verdict."

**3 — Credential + test (≈30 s).** In the Tamperlens node → Credential →
Create new → paste API key → **Test**. Green.

> "The credential test calls a keyed but unmetered endpoint, so testing
> never spends a document from the quota."

**4 — Main actions (≈90 s).** Execute workflow. Open the Tamperlens output:
`summary.riskScore` 70, `riskBand` high, one `redaction-exposure` signal —
point at the recovered strings in the evidence.

> "This fictional file has text drawn over with black boxes. The engine
> reads paint order, so it reports the covered-not-removed text — with the
> evidence."

Then change the Read node's path to
`showcase-br-comprovante-edited.pdf`, re-execute: `incremental-updates`,
high — the file kept its earlier version inside it. Then switch the
Tamperlens operation to **Get Metadata**, re-execute: producer, dates,
tool traces.

**5 — AI-agent tool (≈60 s).** New workflow → **Chat Trigger** (enable
file uploads) → **AI Agent** (attach Anthropic chat model credential) →
under Tools add **Tamperlens** (operation Inspect Document). In the chat,
upload `showcase-br-comprovante-clean.pdf` (drag from a Finder window you
opened beforehand at `~/work/tamperlens/corpus/synthetic/`) and ask:
*"Is this document edited? Use the tamperlens tool."* The agent calls the
tool and answers from the signals (this one is clean — 0 signals).

> "The node declares usableAsTool, so an agent can inspect documents and
> reason over the signals instead of a raw approve/deny."

Stop recording. Upload to Loom (or wherever), paste the link into the
Creator Portal reply.

## Reset between practice runs

Delete the two workflows and the credentials in the n8n UI, or recreate
the stage wholesale:

```bash
docker rm -f n8n-tamperlens-demo
docker run -d --name n8n-tamperlens-demo -p 5679:5678 \
  -e N8N_SECURE_COOKIE=false \
  -e N8N_RESTRICT_FILE_ACCESS_TO=/data/corpus \
  -v n8n_tamperlens_demo_data:/home/node/.n8n \
  -v ~/work/tamperlens/corpus/synthetic:/data/corpus:ro n8nio/n8n:latest
```

Two flags learned the hard way: without `N8N_RESTRICT_FILE_ACCESS_TO`
the Read File node answers "Access to the file is not allowed", and
without the named volume the account and workflows live in the container
layer and die with it.

Corpus files regenerate with `npx tsx scripts/make-showcase.mjs` in the
tamperlens repo.
