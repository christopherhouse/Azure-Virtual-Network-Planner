# BMAD Azure Module

Microsoft Azure Development Suite - a 6-agent module for comprehensive Azure development support, compatible with both BMAD/Claude Code and GitHub Copilot.

## Agents

| Icon | Name | Role |
|------|------|------|
| 🏗️ | **Stratus** | Azure Infrastructure & Bicep IaC Specialist |
| ⚡ | **Nexus** | Microsoft Agent Framework SDK Specialist |
| 🔷 | **Prism** | Microsoft Fabric Platform Architect |
| 🔥 | **Forge** | Microsoft Foundry Platform Engineer |
| 🧪 | **Sentinel** | Azure SDET & Quality Engineering Specialist |
| 🎼 | **Conductor** | Azure Suite Orchestrator (meta-agent) |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- Git installed
- Claude Code or GitHub Copilot configured

## MCP Server Setup (Required)

This module uses two MCP servers for real-time documentation access:
- **Microsoft Learn MCP** - Official Microsoft/Azure documentation
- **Context7 MCP** - Third-party library documentation (SDKs, frameworks, packages)

You must configure your MCP client to connect to both servers.

### 1. Microsoft Learn MCP Server

- **Endpoint**: `https://learn.microsoft.com/api/mcp`
- **Type**: HTTP (streamable)
- **Authentication**: None required
- **Tools**: `microsoft_docs_search`, `microsoft_docs_fetch`, `microsoft_code_sample_search`

### 2. Context7 MCP Server

- **Command**: `npx -y @upstash/context7-mcp`
- **Type**: stdio
- **Authentication**: Optional API key for higher rate limits
- **Tools**: `resolve-library-id`, `get-library-docs`

### Configuration by Client

**VS Code with GitHub Copilot:**

Add to `.vscode/mcp.json`:
```json
{
  "servers": {
    "microsoft-learn": {
      "type": "http",
      "url": "https://learn.microsoft.com/api/mcp"
    },
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

**Claude Code:**
```bash
claude mcp add microsoft-learn --transport http --url https://learn.microsoft.com/api/mcp
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

**Cursor:**

Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "microsoft-learn": {
      "type": "http",
      "url": "https://learn.microsoft.com/api/mcp"
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### Documentation Strategy

The agents use these servers based on the documentation source:
- **MS Learn MCP**: Azure services, Microsoft products, official Microsoft documentation
- **Context7 MCP**: Third-party libraries, open-source SDKs, frameworks (e.g., LangChain, Terraform, OpenAI SDK)

See [mcp.json](./mcp.json) for the reference configuration, [Microsoft Learn MCP docs](https://learn.microsoft.com/en-us/training/support/mcp), and [Context7 docs](https://context7.com) for detailed setup.

## Platform Support

This module works with both major AI coding platforms:

### BMAD/Claude Code
- **Full-featured agents** with interactive menus, workflows, and orchestration
- **Location:** `/agents/*.md`
- **Invocation:** `/bmad:azure:agents:{agent-name}`
- **Best for:** Complex multi-step workflows, cross-agent orchestration via Conductor

### GitHub Copilot
- **Slim agent profiles** optimized for Copilot's native patterns
- **Location:** `.github/agents/*.agent.md`
- **Invocation:** `@agent-name` in Copilot Chat
- **Best for:** IDE-integrated assistance, quick domain-specific questions

Additional Copilot resources:
- **Instructions** (`.github/instructions/`): Auto-applied coding standards (safety guardrails, responsible AI)
- **Skills** (`.github/skills/`): On-demand knowledge packs (Bicep best practices, WAF assessment, testing standards)
- **Prompts** (`.github/prompts/`): Task-focused commands via `/prompt-name`

**Skills vs Instructions:**
- *Instructions* always apply based on file patterns (e.g., guardrails apply to all files)
- *Skills* auto-load when Copilot detects relevant queries (e.g., "Bicep best practices" loads the bicep skill)

## Action Guardrails

All agents classify actions by risk level to prevent accidental destructive operations:

| Category | Confirmation | Examples |
|----------|--------------|----------|
| **Read-only** | None | Menu display, documentation search, reviews |
| **Simulated** | Explains output format | Code generation, template creation, planning |
| **Destructive** | Explicit y/n confirmation | Deployments, resource deletion, chaos experiments |

Simulated outputs clearly indicate that generated content is not deployed and provide steps to deploy manually.

## Installation

### Step 1: Clone This Module (One-Time Setup)

First, clone this module to a permanent location on your machine. You only need to do this once—afterward, you can reuse it across multiple projects.

```bash
git clone https://github.com/johnhain-msft/bmad-azure-module.git ~/bmad-azure-module
```

### Step 2: Install BMAD in Your Target Project

Now, navigate to the project where you want to use the Azure agents. This should be a **separate repo**—not the module you just cloned.

```bash
cd /path/to/your/project    # Your actual project, NOT ~/bmad-azure-module
npx bmad-method@alpha install
```

> **Note:** This runs a fresh BMAD installation. During setup, you'll be prompted to add custom modules—that's when you'll point to the Azure module from Step 1.

### Step 3: Add the Azure Module

During installation, when prompted:

```
Would you like to install a local custom module? (y/N)
```

1. Answer: `y`
2. When asked for the path, enter: `~/bmad-azure-module` (or wherever you cloned it)

The installer will copy the Azure agents and workflows into your project's `_bmad/azure/` folder.

### Step 4: Verify Installation

After installation, you should see:

```
_bmad/
  azure/
    agents/
      azure-infrastructure.md   # Stratus
      agent-framework-sdk.md    # Nexus
      fabric.md                 # Prism
      ai-foundry.md             # Forge
      sdet.md                   # Sentinel
      conductor.md              # Conductor
    workflows/
      conductor/
        start/workflow.yaml
        continue/workflow.yaml
    config.yaml
    module.yaml
```

## Usage

### Quick Start with Conductor (Recommended)

Conductor is the orchestrator that coordinates all Azure agents. Start here for complex tasks:

```
/bmad:azure:agents:conductor
```

Then use:
- `*start` - Describe your goal, get a decomposed plan
- `*continue` - Execute next step with appropriate specialist
- `*status` - Check current progress

### Direct Agent Access

For domain-specific tasks, invoke specialists directly:

```
/bmad:azure:agents:azure-infrastructure    # Stratus - Infrastructure & Bicep
/bmad:azure:agents:agent-framework-sdk     # Nexus - Agent Framework SDK
/bmad:azure:agents:fabric                  # Prism - Microsoft Fabric
/bmad:azure:agents:ai-foundry              # Forge - AI Foundry
/bmad:azure:agents:sdet                    # Sentinel - Testing & Quality
```

## Agent Details

### Stratus 🏗️ - Azure Infrastructure
- Azure Landing Zones & AI Landing Zones
- Bicep/ARM template authoring
- Well-Architected Framework reviews
- Cost optimization & security baselines

### Nexus ⚡ - Agent Framework SDK
- Microsoft Agent Framework SDK (Python)
- Migration from Semantic Kernel/AutoGen
- Multi-agent workflow design
- MCP server integration

### Prism 🔷 - Microsoft Fabric
- OneLake & lakehouse architecture
- Medallion pattern design
- Spark optimization & Data Factory pipelines
- Power BI Direct Lake integration

### Forge 🔥 - AI Foundry
- Model catalog navigation (11,000+ models)
- Prompt Flow development
- Evaluation pipelines & red-teaming
- Responsible AI configuration

### Sentinel 🧪 - Testing & Quality
- Infrastructure testing with Bicep/ARM validation
- Azure Load Testing & JMeter integration
- Chaos Studio fault injection experiments
- AI agent security testing with PyRIT

### Conductor 🎼 - Orchestrator
- Goal decomposition into workflows
- Specialist coordination & handoffs
- Context management across sessions
- Clean task lifecycle (start → execute → cleanup)

## Updating

To update the module in an existing project:

1. Pull latest changes: `cd ~/bmad-azure-module && git pull`
2. Re-run installer in your project: `npx bmad-method@alpha install`
3. Select "Modify BMAD Installation" and update custom modules

## Support

- [BMAD Method Documentation](https://github.com/bmad-code-org/BMAD-METHOD)
- [BMAD Discord Community](https://discord.gg/gk8jAdXWmj)

## License

MIT
