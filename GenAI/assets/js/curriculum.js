/* ==========================================================================
   curriculum.js — SINGLE SOURCE OF TRUTH for the sidebar and dashboard
   --------------------------------------------------------------------------
   Topics are organised into groups (sidebar menus). Within a group they are in
   study order; numbering on the site is global across groups. `id` is the
   localStorage key for visited state — never rename an id once you have used
   the site. Loaded via <script src>, never fetch(), so the site works over
   file://. CURRICULUM.topics is derived below as the flat, ordered list.

   This site's visited state is namespaced `genai.v1.*`, separate from the C#,
   System Design, DSA, LLD and Playbook sites, so the progress bars never mix.
   ========================================================================== */

window.CURRICULUM = {
  "meta": {
    "title": "GenAI",
    "subtitle": "The AI round · Python"
  },
  "groups": [
    {
      "id": "foundations",
      "label": "Foundations",
      "blurb": "What the AI interview actually grades, then the two things every answer rests on: how a language model behaves as a component, and how it reaches out of its own process to do something.",
      "topics": [
        {
          "id": "genai-round",
          "label": "The GenAI Round",
          "href": "topics/genai-round.html",
          "blurb": "A round that barely existed three years ago and is now on most loops. The four shapes it takes, what is graded in each, the vocabulary you are expected to own, and the failure modes — chief among them answering a system question with a framework name.",
          "sections": [
            { "hash": "#what-is-graded", "label": "What the round is, and what it grades" },
            { "hash": "#round-types", "label": "The four shapes the round takes" },
            { "hash": "#the-clock", "label": "Running a 60-minute AI design round" },
            { "hash": "#vocabulary", "label": "The vocabulary you are expected to own" },
            { "hash": "#failure-modes", "label": "The failure modes, and what to do instead" },
            { "hash": "#prep-plan", "label": "A four-week preparation plan" }
          ]
        },
        {
          "id": "llms-and-prompting",
          "label": "LLMs & Prompting",
          "href": "topics/llms-and-prompting.html",
          "blurb": "The model as a component you are engineering around: tokens as the unit of cost and capacity, what the context window really holds, what temperature and top-p actually do to the distribution, and how to make an answer checkable instead of merely plausible.",
          "sections": [
            { "hash": "#tokens", "label": "Tokens: the unit of everything" },
            { "hash": "#context-window", "label": "The context window, and what fills it" },
            { "hash": "#sampling", "label": "Sampling: temperature, top-k, top-p" },
            { "hash": "#prompting", "label": "Prompting that survives production" },
            { "hash": "#structured-output", "label": "Structured output: making answers checkable" },
            { "hash": "#hallucination", "label": "Hallucination, and what actually reduces it" }
          ]
        },
        {
          "id": "tools-and-function-calling",
          "label": "Tools & Function Calling",
          "href": "topics/tools-and-function-calling.html",
          "blurb": "The single capability that separates a chatbot from an agent. What a tool call is on the wire, how to design a tool a model can actually use, the loop and its termination conditions, and which tools are allowed to run without a human.",
          "sections": [
            { "hash": "#why-tools", "label": "Why tools: chatbot versus agent" },
            { "hash": "#wire-format", "label": "The wire format: what actually happens" },
            { "hash": "#designing-tools", "label": "Designing a tool the model can use" },
            { "hash": "#the-loop", "label": "The agent loop, and when it terminates" },
            { "hash": "#errors", "label": "Errors, retries, and the model's view of failure" },
            { "hash": "#safety", "label": "Which tools may run unsupervised" }
          ]
        }
      ]
    },
    {
      "id": "building",
      "label": "Building",
      "blurb": "The three systems you will be asked to design: retrieval that grounds the model in your data, evaluation that tells you whether a change helped, and the agent architecture that ties them together.",
      "topics": [
        {
          "id": "rag",
          "label": "RAG",
          "href": "topics/rag.html",
          "blurb": "The most-asked design question in the round. Embeddings and vector search, why chunking sets your ceiling before any model choice does, hybrid search with reciprocal rank fusion, two-stage retrieval with a reranker, and the failure modes you only find by measuring retrieval separately.",
          "sections": [
            { "hash": "#why-rag", "label": "Why retrieval, and when not to" },
            { "hash": "#embeddings", "label": "Embeddings and vector search" },
            { "hash": "#chunking", "label": "Chunking: the decision that sets your ceiling" },
            { "hash": "#hybrid", "label": "Hybrid search: BM25, vectors, and RRF" },
            { "hash": "#reranking", "label": "Reranking and the two-stage pipeline" },
            { "hash": "#context-assembly", "label": "Assembling the context, and citing it" },
            { "hash": "#failure-modes", "label": "Where RAG fails, and how you find out" }
          ]
        },
        {
          "id": "evals",
          "label": "Evals",
          "href": "topics/evals.html",
          "blurb": "The answer to \"how do you know it got better?\" — and the thing most candidates have no answer for. Building a golden set worth having, deterministic metrics before semantic ones, where LLM-as-judge works and how it lies, and putting a regression gate in CI.",
          "sections": [
            { "hash": "#why-evals", "label": "Why evals, and what they replace" },
            { "hash": "#golden-data", "label": "Golden datasets worth having" },
            { "hash": "#metrics", "label": "Metrics: deterministic, then semantic" },
            { "hash": "#llm-judge", "label": "LLM-as-judge: when it works, how it lies" },
            { "hash": "#rag-evals", "label": "Evaluating retrieval separately from generation" },
            { "hash": "#ci", "label": "Evals in CI, and regression gates" }
          ]
        },
        {
          "id": "agents",
          "label": "Agents",
          "href": "topics/agents.html",
          "blurb": "Anatomy — model, tools, memory, guard-rails — then the design decisions that matter: why models are stateless and what that costs, when an agent should be a state machine instead, what multi-agent buys and what it costs, MCP as a protocol, and where the human goes.",
          "sections": [
            { "hash": "#anatomy", "label": "Anatomy of an agent" },
            { "hash": "#memory", "label": "Memory and context engineering" },
            { "hash": "#guardrails", "label": "Guard-rails and validation" },
            { "hash": "#state-machines", "label": "When an agent should be a state machine" },
            { "hash": "#multi-agent", "label": "Multi-agent: delegation, hand-off, and when not to" },
            { "hash": "#mcp", "label": "MCP: tools as a protocol" },
            { "hash": "#hitl", "label": "Human-in-the-loop and approvals" }
          ]
        }
      ]
    },
    {
      "id": "internals",
      "label": "Internals",
      "blurb": "Where candidates are actually separated. Far more people have built a RAG pipeline than can explain what a causal mask does, why LoRA works, or why generation is memory-bandwidth-bound.",
      "topics": [
        {
          "id": "transformer-internals",
          "label": "Transformer Internals",
          "href": "topics/transformer-internals.html",
          "blurb": "Attention from the matmul up: why positional information has to be added separately, what the causal mask buys you, why multiple heads beat one wide one, where the residual stream fits, and how logits become text.",
          "sections": [
            { "hash": "#embeddings", "label": "Token and positional embeddings" },
            { "hash": "#attention", "label": "Self-attention, step by step" },
            { "hash": "#causal-masking", "label": "Causal masking: how a decoder stays honest" },
            { "hash": "#multi-head", "label": "Multi-head attention and the residual stream" },
            { "hash": "#norm-and-ffn", "label": "LayerNorm, the FFN, and the block" },
            { "hash": "#decoding", "label": "From logits to text" }
          ]
        },
        {
          "id": "training-and-fine-tuning",
          "label": "Training & Fine-Tuning",
          "href": "topics/training-and-fine-tuning.html",
          "blurb": "Pre-train, instruction-tune, align — what each stage changes and what it costs. Then the question you will actually be asked: when to fine-tune rather than prompt or retrieve, and how LoRA and QLoRA make it affordable.",
          "sections": [
            { "hash": "#three-stages", "label": "The three stages" },
            { "hash": "#pretraining", "label": "Pre-training: data, objective, loop" },
            { "hash": "#when-to-finetune", "label": "When to fine-tune, and when not to" },
            { "hash": "#lora", "label": "LoRA: why a low-rank update is enough" },
            { "hash": "#qlora", "label": "QLoRA: NF4 and one GPU" },
            { "hash": "#preference", "label": "Preference tuning: RLHF and DPO" },
            { "hash": "#evaluating", "label": "Knowing whether it worked" }
          ]
        },
        {
          "id": "inference-and-serving",
          "label": "Inference & Serving",
          "href": "topics/inference-and-serving.html",
          "blurb": "Why generation is limited by memory bandwidth and not arithmetic, and everything that follows from it: quantization and k-quants, GGUF, the KV cache, prompt caching, continuous batching, Mixture of Experts, and how to pick a serving stack.",
          "sections": [
            { "hash": "#the-constraint", "label": "The constraint: bandwidth, not compute" },
            { "hash": "#quantization", "label": "Quantization: INT8, INT4, k-quants" },
            { "hash": "#gguf", "label": "GGUF and llama.cpp" },
            { "hash": "#kv-cache", "label": "The KV cache" },
            { "hash": "#prompt-caching", "label": "Prompt caching and prefix reuse" },
            { "hash": "#batching", "label": "Batching and continuous batching" },
            { "hash": "#moe", "label": "Mixture of Experts" },
            { "hash": "#serving", "label": "Choosing a serving stack" }
          ]
        }
      ]
    }
  ]
};

/* Flat list in study order — what nav.js, visited.js and the dashboard iterate. */
window.CURRICULUM.topics = window.CURRICULUM.groups.reduce(function (acc, g) {
  g.topics.forEach(function (t) { t.group = g.id; t.groupLabel = g.label; acc.push(t); });
  return acc;
}, []);
