# n8n-nodes-tamperlens

This is an n8n community node for [Tamperlens](https://tamperlens.com) — a
Document Trust API that reports **structural fraud signals** on PDFs, images
and Office documents: revision chains, font anomalies, producer fingerprints,
metadata mismatches, redaction exposure and more. Every signal ships with its
evidence and the benign explanation, and the API never returns an
approve/deny verdict — the judgment stays with your workflow.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/)
workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)
in the n8n community nodes documentation:

**Settings → Community Nodes → Install** → `n8n-nodes-tamperlens`

## Operations

| Operation | What it does | Metering |
|---|---|---|
| **Inspect Document** | Full structural inspection of a PDF, image (JPEG/PNG/WebP/HEIC/AVIF) or Office file. Returns `summary.riskScore`, `summary.riskBand` and a `signals[]` array, each with evidence. Optional issuer baseline via the Issuer field. | 1 document |
| **Get Metadata** | The metadata a file carries — authors, tools, dates, machine paths, device traces — without a full inspection. | 1 document |
| **Compare Documents** | Diff a candidate PDF against the original you already trust: the strongest check there is. Takes two binary fields. | 2 documents |

All operations read the document from the incoming item's **binary** data and
never persist it: Tamperlens parses files in memory and discards them with the
response. Maximum file size 10 MB.

## Credentials

Create a free API key at [tamperlens.com/account](https://tamperlens.com/account)
— 50 documents a month, no card. Paste it into the **Tamperlens API**
credential. The credential test calls a keyed, unmetered endpoint, so testing
never spends quota.

## Usage

A typical screening flow:

1. A trigger delivers a document (IMAP attachment, webhook upload, watched folder).
2. **Tamperlens → Inspect Document** on the binary.
3. An **IF** node routes on `{{$json.summary.riskBand}}` — `low` continues
   automatically, `elevated`/`high` goes to a human queue with
   `{{$json.signals}}` attached as the reviewer's evidence.

Branch on `signals[].id` (stable family ids) when one family matters more to
your flow than the single score does. Store `signals[].evidence` — it is
small, contains no document content, and is what a human reviewer needs.

> Tamperlens reports risk signals, not authenticity verdicts. Signals can have
> benign causes; combine them with your own decision logic.

## Compatibility

Requires n8n 1.x (tested against recent releases) and Node.js ≥ 20. The
package has **zero runtime dependencies**.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Tamperlens API quickstart](https://tamperlens.com/api)
- [API reference](https://tamperlens.com/api-reference) · [OpenAPI](https://tamperlens.com/docs)
- [The 18 signal families](https://tamperlens.com/pdf-fraud-signals)
- [Measured false-positive rate](https://tamperlens.com/evidence)

## License

[MIT](LICENSE)
