/* ==========================================================================
   curriculum.js — SINGLE SOURCE OF TRUTH for the sidebar and dashboard
   --------------------------------------------------------------------------
   Topics are organised into groups (sidebar menus). Within a group they are in
   study order; numbering on the site is global across groups. `id` is the
   localStorage key for visited state — never rename an id once you have used
   the site. Loaded via <script src>, never fetch(), so the site works over
   file://. CURRICULUM.topics is derived below as the flat, ordered list.
   ========================================================================== */

window.CURRICULUM = {
  meta: { title: 'C# Learning Path', subtitle: 'Core to cloud · with Python alongside' },
  groups: [
    {
      "id": "dotnet",
      "label": "C# & .NET",
      "blurb": "The language and the service-building toolkit. Do these in order.",
      "topics": [
        {
          "id": "core-concepts",
          "label": "Core Concepts",
          "href": "topics/core-concepts.html",
          "blurb": "The language itself: types, collections, classes, generics, delegates, LINQ, exceptions, async. Start here.",
          "sections": [
            {
              "hash": "#types",
              "label": "Types, variables and type inference"
            },
            {
              "hash": "#value-reference",
              "label": "Value types vs reference types"
            },
            {
              "hash": "#strings",
              "label": "Strings and StringBuilder"
            },
            {
              "hash": "#control-flow",
              "label": "Control flow"
            },
            {
              "hash": "#collections",
              "label": "Collections: List, Dictionary, HashSet, Queue, Stack"
            },
            {
              "hash": "#classes",
              "label": "Classes, structs and records"
            },
            {
              "hash": "#properties",
              "label": "Properties, indexers and init-only setters"
            },
            {
              "hash": "#interfaces",
              "label": "Interfaces and abstract classes"
            },
            {
              "hash": "#inheritance",
              "label": "Inheritance and polymorphism"
            },
            {
              "hash": "#generics",
              "label": "Generics and constraints"
            },
            {
              "hash": "#delegates",
              "label": "Delegates, events and lambdas"
            },
            {
              "hash": "#linq",
              "label": "LINQ — query and method syntax"
            },
            {
              "hash": "#exceptions",
              "label": "Exceptions"
            },
            {
              "hash": "#nullable",
              "label": "Nullable types and pattern matching"
            },
            {
              "hash": "#extension-methods",
              "label": "Extension methods"
            },
            {
              "hash": "#idisposable",
              "label": "IDisposable and the using statement"
            },
            {
              "hash": "#async-intro",
              "label": "async / await — the basics"
            }
          ]
        },
        {
          "id": "threading",
          "label": "Threading & Async",
          "href": "topics/threading.html",
          "blurb": "Threads, the thread pool, Tasks, async/await internals, locks, concurrent collections, cancellation, Channels, and the classic deadlocks.",
          "sections": [
            {
              "hash": "#thread-threadpool",
              "label": "Thread and ThreadPool"
            },
            {
              "hash": "#tasks",
              "label": "Task and the Task Parallel Library"
            },
            {
              "hash": "#async-deep",
              "label": "async / await — how it really works"
            },
            {
              "hash": "#lock-monitor",
              "label": "lock and Monitor"
            },
            {
              "hash": "#mutex-semaphore",
              "label": "Mutex, Semaphore and SemaphoreSlim"
            },
            {
              "hash": "#interlocked",
              "label": "Interlocked, volatile and memory model"
            },
            {
              "hash": "#concurrent-collections",
              "label": "Concurrent collections"
            },
            {
              "hash": "#cancellation",
              "label": "CancellationToken"
            },
            {
              "hash": "#parallel",
              "label": "Parallel.For, Parallel.ForEachAsync and PLINQ"
            },
            {
              "hash": "#deadlocks",
              "label": "Deadlocks, ConfigureAwait and sync-over-async"
            },
            {
              "hash": "#channels",
              "label": "Channels and producer / consumer pipelines"
            },
            {
              "hash": "#gil",
              "label": "The Python GIL — what it changes"
            }
          ]
        },
        {
          "id": "web-api",
          "label": "ASP.NET Core Web API",
          "href": "topics/web-api.html",
          "blurb": "Minimal APIs and controllers, routing, model binding, validation, DI, middleware, filters, error handling, versioning, HttpClient, OpenAPI, CORS, caching.",
          "sections": [
            {
              "hash": "#minimal-vs-controllers",
              "label": "Minimal APIs vs controllers"
            },
            {
              "hash": "#routing-binding",
              "label": "Routing and model binding"
            },
            {
              "hash": "#validation",
              "label": "Validation"
            },
            {
              "hash": "#di",
              "label": "Dependency injection and service lifetimes"
            },
            {
              "hash": "#middleware",
              "label": "Middleware pipeline"
            },
            {
              "hash": "#filters",
              "label": "Filters (MVC) and endpoint filters"
            },
            {
              "hash": "#error-handling",
              "label": "Error handling and ProblemDetails"
            },
            {
              "hash": "#versioning",
              "label": "API versioning"
            },
            {
              "hash": "#httpclient",
              "label": "HttpClient and IHttpClientFactory"
            },
            {
              "hash": "#openapi",
              "label": "OpenAPI / Swagger"
            },
            {
              "hash": "#cors",
              "label": "CORS"
            },
            {
              "hash": "#caching-ratelimit",
              "label": "Caching and rate limiting"
            }
          ]
        },
        {
          "id": "security",
          "label": "Security",
          "href": "topics/security.html",
          "blurb": "Authentication vs authorization, JWT, OAuth2/OIDC with Entra ID, policies, password hashing, secrets, HTTPS, OWASP top 10 in .NET, Data Protection.",
          "sections": [
            {
              "hash": "#authn-authz",
              "label": "Authentication vs authorization"
            },
            {
              "hash": "#jwt",
              "label": "JWT bearer tokens"
            },
            {
              "hash": "#oauth-oidc",
              "label": "OAuth 2.0, OpenID Connect and Microsoft Entra ID"
            },
            {
              "hash": "#policies",
              "label": "Role-, claim- and policy-based authorization"
            },
            {
              "hash": "#passwords",
              "label": "Password hashing and ASP.NET Core Identity"
            },
            {
              "hash": "#secrets",
              "label": "Secrets and configuration"
            },
            {
              "hash": "#transport",
              "label": "HTTPS, HSTS and security headers"
            },
            {
              "hash": "#owasp",
              "label": "OWASP Top 10 in .NET: injection, XSS, CSRF, SSRF"
            },
            {
              "hash": "#data-protection",
              "label": "Data Protection API and encryption"
            },
            {
              "hash": "#input-validation",
              "label": "Input validation and safe defaults"
            }
          ]
        },
        {
          "id": "entity-framework",
          "label": "Entity Framework Core & Data Access",
          "href": "topics/entity-framework.html",
          "blurb": "DbContext, configuration, migrations, CRUD, LINQ-to-SQL, relationships and loading strategies, tracking, transactions, the N+1 trap, and Dapper.",
          "sections": [
            {
              "hash": "#dbcontext",
              "label": "DbContext and entities"
            },
            {
              "hash": "#configuration",
              "label": "Model configuration: conventions, attributes, Fluent API"
            },
            {
              "hash": "#migrations",
              "label": "Migrations"
            },
            {
              "hash": "#crud",
              "label": "CRUD and SaveChanges"
            },
            {
              "hash": "#linq-sql",
              "label": "LINQ to SQL translation and IQueryable"
            },
            {
              "hash": "#relationships",
              "label": "Relationships and loading strategies"
            },
            {
              "hash": "#tracking",
              "label": "Change tracking vs AsNoTracking"
            },
            {
              "hash": "#transactions",
              "label": "Transactions and optimistic concurrency"
            },
            {
              "hash": "#n-plus-one",
              "label": "The N+1 problem and other performance traps"
            },
            {
              "hash": "#dapper",
              "label": "Dapper and when to skip the ORM"
            }
          ]
        },
        {
          "id": "design-patterns",
          "label": "Design Patterns & SOLID",
          "href": "topics/design-patterns.html",
          "blurb": "The five SOLID principles with before/after code, then the creational, structural and behavioural patterns that come up in .NET codebases and interviews, plus DI, Repository/Unit of Work and CQRS.",
          "sections": [
            {
              "hash": "#srp",
              "label": "S — Single Responsibility"
            },
            {
              "hash": "#ocp",
              "label": "O — Open/Closed"
            },
            {
              "hash": "#lsp",
              "label": "L — Liskov Substitution"
            },
            {
              "hash": "#isp",
              "label": "I — Interface Segregation"
            },
            {
              "hash": "#dip",
              "label": "D — Dependency Inversion"
            },
            {
              "hash": "#singleton",
              "label": "Singleton"
            },
            {
              "hash": "#factory",
              "label": "Factory Method and Abstract Factory"
            },
            {
              "hash": "#builder",
              "label": "Builder"
            },
            {
              "hash": "#adapter",
              "label": "Adapter"
            },
            {
              "hash": "#decorator",
              "label": "Decorator"
            },
            {
              "hash": "#facade",
              "label": "Facade"
            },
            {
              "hash": "#strategy",
              "label": "Strategy"
            },
            {
              "hash": "#observer",
              "label": "Observer"
            },
            {
              "hash": "#command",
              "label": "Command"
            },
            {
              "hash": "#mediator",
              "label": "Mediator (and MediatR)"
            },
            {
              "hash": "#di-ioc",
              "label": "Dependency Injection and IoC containers"
            },
            {
              "hash": "#repository-uow",
              "label": "Repository and Unit of Work"
            },
            {
              "hash": "#cqrs",
              "label": "CQRS — an introduction"
            }
          ]
        },
        {
          "id": "testing",
          "label": "Testing (essentials)",
          "href": "topics/testing.html",
          "blurb": "A deliberately short page: xUnit basics and AAA, data-driven tests, Moq, FluentAssertions, and one end-to-end integration test with WebApplicationFactory. pytest alongside.",
          "sections": [
            {
              "hash": "#xunit-basics",
              "label": "xUnit basics and Arrange-Act-Assert"
            },
            {
              "hash": "#theory",
              "label": "Data-driven tests: [Theory], [InlineData], [MemberData]"
            },
            {
              "hash": "#moq",
              "label": "Isolating with Moq"
            },
            {
              "hash": "#fluent-assertions",
              "label": "Readable assertions with FluentAssertions"
            },
            {
              "hash": "#integration",
              "label": "One integration test with WebApplicationFactory"
            }
          ]
        },
        {
          "id": "dsa",
          "label": "Data Structures & Algorithms in C#",
          "href": "topics/dsa.html",
          "blurb": "The patterns behind most coding-round questions — frequency maps, two pointers, sliding window, stacks, linked lists, binary search, BFS/DFS, heaps, DP — each in idiomatic C# and Python.",
          "sections": [
            {
              "hash": "#arrays-strings",
              "label": "Arrays and strings"
            },
            {
              "hash": "#frequency-map",
              "label": "Dictionary frequency map"
            },
            {
              "hash": "#two-pointers",
              "label": "Two pointers"
            },
            {
              "hash": "#sliding-window",
              "label": "Sliding window"
            },
            {
              "hash": "#stack-queue",
              "label": "Stack and queue patterns"
            },
            {
              "hash": "#linked-list",
              "label": "Linked lists"
            },
            {
              "hash": "#binary-search",
              "label": "Binary search"
            },
            {
              "hash": "#sorting",
              "label": "Sorting and comparers"
            },
            {
              "hash": "#graphs",
              "label": "BFS and DFS on graphs and grids"
            },
            {
              "hash": "#heap",
              "label": "Heaps and PriorityQueue"
            },
            {
              "hash": "#dp",
              "label": "Dynamic programming — an introduction"
            }
          ]
        },
        {
          "id": "performance",
          "label": "Performance, GC & Memory",
          "href": "topics/performance.html",
          "blurb": "How the garbage collector works, allocation-free techniques (Span, ArrayPool, structs), string handling, async pitfalls, caching, and the tools — BenchmarkDotNet, dotnet-counters, dotnet-trace.",
          "sections": [
            {
              "hash": "#gc",
              "label": "GC generations, LOH and GC modes"
            },
            {
              "hash": "#dispose-finalizers",
              "label": "IDisposable, finalizers and unmanaged resources"
            },
            {
              "hash": "#structs-boxing",
              "label": "Structs vs classes, boxing and readonly"
            },
            {
              "hash": "#span",
              "label": "Span<T>, Memory<T> and stackalloc"
            },
            {
              "hash": "#arraypool",
              "label": "ArrayPool, object pooling and buffer reuse"
            },
            {
              "hash": "#strings",
              "label": "String handling costs"
            },
            {
              "hash": "#async-pitfalls",
              "label": "Async performance pitfalls"
            },
            {
              "hash": "#caching",
              "label": "Caching strategies"
            },
            {
              "hash": "#benchmarkdotnet",
              "label": "Measuring with BenchmarkDotNet"
            },
            {
              "hash": "#profiling",
              "label": "Profiling and diagnostics in production"
            }
          ]
        },
        {
          "id": "microservices",
          "label": "Microservices",
          "href": "topics/microservices.html",
          "blurb": "Service boundaries, API gateway, sync vs async communication, resilience with Polly, sagas and the outbox pattern, health checks, observability with OpenTelemetry, Docker, configuration.",
          "sections": [
            {
              "hash": "#boundaries",
              "label": "Characteristics and service boundaries"
            },
            {
              "hash": "#gateway",
              "label": "API gateway and BFF"
            },
            {
              "hash": "#communication",
              "label": "Sync vs async communication: REST, gRPC, messaging"
            },
            {
              "hash": "#resilience",
              "label": "Resilience: retry, circuit breaker, timeout, bulkhead"
            },
            {
              "hash": "#saga-outbox",
              "label": "Sagas and the transactional outbox"
            },
            {
              "hash": "#health-checks",
              "label": "Health checks"
            },
            {
              "hash": "#observability",
              "label": "Observability: logs, metrics, traces with OpenTelemetry"
            },
            {
              "hash": "#docker",
              "label": "Docker and docker-compose for local development"
            },
            {
              "hash": "#configuration",
              "label": "Configuration across environments"
            }
          ]
        },
        {
          "id": "service-fabric",
          "label": "Azure Service Fabric",
          "href": "topics/service-fabric.html",
          "blurb": "Cluster model, stateless vs stateful services, Reliable Collections, Reliable Actors, partitioning and replicas, communication (remoting, reverse proxy), upgrades, health and configuration.",
          "sections": [
            {
              "hash": "#concepts",
              "label": "Cluster, nodes, applications and services"
            },
            {
              "hash": "#stateless-stateful",
              "label": "Stateless vs stateful services"
            },
            {
              "hash": "#reliable-collections",
              "label": "Reliable Collections"
            },
            {
              "hash": "#actors",
              "label": "Reliable Actors"
            },
            {
              "hash": "#partitioning",
              "label": "Partitioning, replicas and quorum"
            },
            {
              "hash": "#communication",
              "label": "Communication: remoting, reverse proxy, Kestrel"
            },
            {
              "hash": "#upgrades-health",
              "label": "Upgrades, health and monitoring"
            },
            {
              "hash": "#config-secrets",
              "label": "Configuration, secrets and containers"
            }
          ]
        }
      ]
    },
    {
      "id": "azure",
      "label": "Azure",
      "blurb": "The platform: services, identity, networking, integration, data & AI, and how it is all governed.",
      "topics": [
        {
          "id": "azure-services",
          "label": "Azure Services for .NET",
          "href": "topics/azure-services.html",
          "blurb": "The services a .NET backend engineer touches most: App Service, Functions, Storage, Service Bus, Event Hubs, Cosmos DB, Azure SQL, Key Vault, Managed Identity, Application Insights, AKS and Container Apps — with the C# and Python SDK calls.",
          "sections": [
            {
              "hash": "#app-service",
              "label": "App Service"
            },
            {
              "hash": "#functions",
              "label": "Azure Functions"
            },
            {
              "hash": "#storage",
              "label": "Azure Storage: Blobs, Queues, Tables"
            },
            {
              "hash": "#service-bus",
              "label": "Service Bus"
            },
            {
              "hash": "#event-hubs",
              "label": "Event Hubs"
            },
            {
              "hash": "#cosmos",
              "label": "Cosmos DB"
            },
            {
              "hash": "#azure-sql",
              "label": "Azure SQL Database"
            },
            {
              "hash": "#key-vault",
              "label": "Key Vault"
            },
            {
              "hash": "#managed-identity",
              "label": "Managed Identity and DefaultAzureCredential"
            },
            {
              "hash": "#app-insights",
              "label": "Application Insights and Azure Monitor"
            },
            {
              "hash": "#aks-container-apps",
              "label": "AKS and Azure Container Apps"
            }
          ]
        },
        {
          "id": "azure-identity",
          "label": "Microsoft Entra ID & App Identity",
          "href": "topics/azure-identity.html",
          "blurb": "Tenants, app registrations, scopes and app roles, the OAuth 2.0 flows you actually use, protecting and calling APIs with Microsoft.Identity.Web / MSAL, Azure RBAC vs app roles, workload identity federation and External ID.",
          "sections": [
            {
              "hash": "#entra-basics",
              "label": "Tenants, app registrations, service principals and tokens"
            },
            {
              "hash": "#app-registrations",
              "label": "Scopes, app roles and consent"
            },
            {
              "hash": "#oauth-flows",
              "label": "The three OAuth 2.0 flows you need"
            },
            {
              "hash": "#calling-apis",
              "label": "Token caching, Microsoft Graph and downstream APIs"
            },
            {
              "hash": "#rbac",
              "label": "Azure RBAC vs app roles vs groups"
            },
            {
              "hash": "#workload-identity",
              "label": "No secrets: managed identity and workload identity federation"
            },
            {
              "hash": "#external-id",
              "label": "External ID (B2C) for customer-facing apps"
            },
            {
              "hash": "#zero-trust",
              "label": "Conditional Access, MFA and PIM"
            }
          ]
        },
        {
          "id": "azure-networking",
          "label": "Azure Networking for App Developers",
          "href": "topics/azure-networking.html",
          "blurb": "Just enough networking to ship a private, load-balanced app: VNets and NSGs, Private Endpoints, VNet integration for App Service / Functions / Container Apps, choosing between Load Balancer, Application Gateway, Front Door and Traffic Manager, WAF, private DNS, and hub-spoke basics.",
          "sections": [
            {
              "hash": "#vnet",
              "label": "VNets, subnets and Network Security Groups"
            },
            {
              "hash": "#private-endpoints",
              "label": "Private Link and Private Endpoints"
            },
            {
              "hash": "#vnet-integration",
              "label": "VNet integration for App Service, Functions and Container Apps"
            },
            {
              "hash": "#load-balancing",
              "label": "Choosing a load balancer"
            },
            {
              "hash": "#app-gateway-waf",
              "label": "Application Gateway and the Web Application Firewall"
            },
            {
              "hash": "#dns",
              "label": "Azure DNS, private DNS zones and custom domains"
            },
            {
              "hash": "#hub-spoke",
              "label": "Hub-spoke, Azure Firewall and hybrid connectivity"
            }
          ]
        },
        {
          "id": "azure-integration",
          "label": "Azure Integration Services",
          "href": "topics/azure-integration.html",
          "blurb": "The glue between services: API Management (gateway, products, policies), Event Grid, Logic Apps, App Configuration, Azure Cache for Redis, SignalR Service — and a decision table for which messaging service to pick.",
          "sections": [
            {
              "hash": "#apim",
              "label": "API Management: gateway, products and subscriptions"
            },
            {
              "hash": "#apim-policies",
              "label": "Policies: the part you will actually write"
            },
            {
              "hash": "#event-grid",
              "label": "Event Grid: push-based eventing"
            },
            {
              "hash": "#logic-apps",
              "label": "Logic Apps and Durable Functions: which workflow engine?"
            },
            {
              "hash": "#app-configuration",
              "label": "App Configuration: central settings and feature flags"
            },
            {
              "hash": "#redis",
              "label": "Azure Cache for Redis / Azure Managed Redis"
            },
            {
              "hash": "#signalr",
              "label": "Real-time: Azure SignalR Service and Web PubSub"
            },
            {
              "hash": "#choosing",
              "label": "Which messaging service?"
            }
          ]
        },
        {
          "id": "azure-data-ai",
          "label": "Azure Data, Search & AI",
          "href": "topics/azure-data-ai.html",
          "blurb": "Beyond the transactional store: Data Lake Storage and Parquet, Data Factory / Fabric pipelines, Azure AI Search (full-text + vector), Azure OpenAI (chat, embeddings, structured output), the RAG pattern end to end, and Document Intelligence for extracting data from PDFs.",
          "sections": [
            {
              "hash": "#data-lake",
              "label": "Data Lake Storage Gen2 and Parquet"
            },
            {
              "hash": "#pipelines",
              "label": "Data Factory, Synapse and Microsoft Fabric"
            },
            {
              "hash": "#ai-search",
              "label": "Azure AI Search: indexes, indexers and vector search"
            },
            {
              "hash": "#azure-openai",
              "label": "Azure OpenAI: chat, embeddings and structured output"
            },
            {
              "hash": "#rag",
              "label": "The RAG pattern end to end"
            },
            {
              "hash": "#document-intelligence",
              "label": "Azure AI services: Document Intelligence, Language, Vision"
            }
          ]
        },
        {
          "id": "azure-architecture",
          "label": "Azure Architecture & Governance",
          "href": "topics/azure-architecture.html",
          "blurb": "How the pieces are organised and kept safe: management groups, subscriptions and tagging; RBAC, Azure Policy and locks; the Well-Architected pillars; regions, zones and composite SLAs; backup and DR (RTO/RPO); cost management; landing zones; and a reference architecture for a .NET web workload.",
          "sections": [
            {
              "hash": "#hierarchy",
              "label": "Management groups, subscriptions, resource groups, tags"
            },
            {
              "hash": "#policy",
              "label": "RBAC, Azure Policy and resource locks"
            },
            {
              "hash": "#well-architected",
              "label": "The Well-Architected Framework"
            },
            {
              "hash": "#resiliency",
              "label": "Regions, availability zones and composite SLAs"
            },
            {
              "hash": "#dr",
              "label": "Backup, disaster recovery, RTO and RPO"
            },
            {
              "hash": "#cost",
              "label": "Cost management and FinOps"
            },
            {
              "hash": "#landing-zones",
              "label": "Landing zones and the Cloud Adoption Framework"
            },
            {
              "hash": "#reference-arch",
              "label": "Reference architecture: a .NET web workload on Azure"
            }
          ]
        }
      ]
    },
    {
      "id": "devops",
      "label": "DevOps",
      "blurb": "Getting code to production and keeping it there: pipelines, containers, Kubernetes, IaC, and operations.",
      "topics": [
        {
          "id": "azure-devops",
          "label": "Azure DevOps",
          "href": "topics/azure-devops.html",
          "blurb": "Boards, Repos and branch policies, YAML pipelines end to end (build, test, publish, deploy), stages/jobs/steps, variables, templates, environments and approvals, artifacts, service connections, release strategies.",
          "sections": [
            {
              "hash": "#boards",
              "label": "Boards: work items, sprints and linking"
            },
            {
              "hash": "#repos",
              "label": "Repos: branching strategy and branch policies"
            },
            {
              "hash": "#pipeline-basics",
              "label": "A complete YAML pipeline for a .NET API"
            },
            {
              "hash": "#stages-jobs-steps",
              "label": "Stages, jobs and steps"
            },
            {
              "hash": "#variables",
              "label": "Variables, variable groups and secrets"
            },
            {
              "hash": "#templates",
              "label": "Templates: reuse across pipelines"
            },
            {
              "hash": "#environments",
              "label": "Environments, approvals and checks"
            },
            {
              "hash": "#artifacts",
              "label": "Artifacts: pipeline artifacts and Azure Artifacts feeds"
            },
            {
              "hash": "#service-connections",
              "label": "Service connections and identity"
            },
            {
              "hash": "#deploy-appservice",
              "label": "Deploying: App Service, containers, database migrations"
            },
            {
              "hash": "#release-strategies",
              "label": "Release strategies and rollback"
            }
          ]
        },
        {
          "id": "github-actions",
          "label": "GitHub Actions & CI/CD Patterns",
          "href": "topics/github-actions.html",
          "blurb": "Workflow anatomy (triggers, jobs, steps, runners); building and testing .NET and Python with caching and matrices; OIDC login to Azure with no secrets; reusable workflows and composite actions; environments and protection rules; deploying to App Service, Container Apps and AKS; supply-chain hygiene (pinning, Dependabot, CodeQL); how it maps to Azure Pipelines.",
          "sections": [
            {
              "hash": "#anatomy",
              "label": "Workflow anatomy: triggers, jobs, steps, runners"
            },
            {
              "hash": "#dotnet-python",
              "label": "Build and test .NET and Python with caching and a matrix"
            },
            {
              "hash": "#oidc",
              "label": "OIDC login to Azure: no secrets in GitHub"
            },
            {
              "hash": "#reuse",
              "label": "Reusable workflows and composite actions"
            },
            {
              "hash": "#environments",
              "label": "Environments, protection rules and secrets"
            },
            {
              "hash": "#deploy-targets",
              "label": "Deploying to App Service, Container Apps and AKS"
            },
            {
              "hash": "#supply-chain",
              "label": "Supply-chain hygiene: pinning, Dependabot, CodeQL, secrets"
            },
            {
              "hash": "#vs-azure-pipelines",
              "label": "GitHub Actions vs Azure Pipelines: translation table"
            }
          ]
        },
        {
          "id": "docker-containers",
          "label": "Docker & Containers",
          "href": "topics/docker-containers.html",
          "blurb": "Images, layers and registries; production Dockerfiles for .NET and Python (multi-stage, non-root, chiseled/slim); docker compose for local dev; Azure Container Registry with tasks and scanning; configuration and secrets; debugging running containers; supply-chain basics (SBOM, signing).",
          "sections": [
            {
              "hash": "#images",
              "label": "Images, layers, containers and registries"
            },
            {
              "hash": "#dockerfile",
              "label": "Production Dockerfiles for .NET and Python"
            },
            {
              "hash": "#compose",
              "label": "docker compose for local development"
            },
            {
              "hash": "#acr",
              "label": "Azure Container Registry: push, build, scan"
            },
            {
              "hash": "#config-secrets",
              "label": "Configuration and secrets in containers"
            },
            {
              "hash": "#debugging",
              "label": "Debugging and resource limits"
            },
            {
              "hash": "#supply-chain",
              "label": "Image security and supply chain"
            }
          ]
        },
        {
          "id": "kubernetes-aks",
          "label": "Kubernetes & AKS",
          "href": "topics/kubernetes-aks.html",
          "blurb": "Pods, Deployments, Services, Ingress; ConfigMaps, Secrets, probes and resource requests; HPA, KEDA and cluster autoscaling; Helm and Kustomize; AKS specifics (node pools, workload identity, Key Vault CSI, ACR); deploying from a pipeline with rollouts and rollbacks; the kubectl troubleshooting loop.",
          "sections": [
            {
              "hash": "#core-objects",
              "label": "Pods, Deployments, Services and namespaces"
            },
            {
              "hash": "#config",
              "label": "ConfigMaps, Secrets, probes and resources"
            },
            {
              "hash": "#ingress",
              "label": "Ingress, Gateway API and TLS"
            },
            {
              "hash": "#scaling",
              "label": "HPA, KEDA and the cluster autoscaler"
            },
            {
              "hash": "#helm",
              "label": "Helm and Kustomize"
            },
            {
              "hash": "#aks",
              "label": "AKS specifics: node pools, identity, secrets, registry"
            },
            {
              "hash": "#deploy",
              "label": "Deploying from a pipeline: rollouts and rollbacks"
            },
            {
              "hash": "#troubleshooting",
              "label": "The kubectl troubleshooting loop"
            }
          ]
        },
        {
          "id": "infrastructure-as-code",
          "label": "Infrastructure as Code: Bicep & Terraform",
          "href": "topics/infrastructure-as-code.html",
          "blurb": "Why IaC and how ARM, Bicep and Terraform relate; Bicep resources, parameters, modules, what-if and deployment stacks; Terraform providers, state, backends, workspaces and modules; running IaC in a pipeline with plan → approve → apply; testing and policy (PSRule, tflint, Checkov); choosing between them.",
          "sections": [
            {
              "hash": "#why",
              "label": "Why IaC, and ARM → Bicep → Terraform"
            },
            {
              "hash": "#bicep",
              "label": "Bicep: resources, parameters, modules, existing"
            },
            {
              "hash": "#bicep-deploy",
              "label": "Deploying Bicep: what-if, modes and deployment stacks"
            },
            {
              "hash": "#terraform",
              "label": "Terraform: providers, resources, variables, modules"
            },
            {
              "hash": "#state",
              "label": "Terraform state: backends, locking, workspaces"
            },
            {
              "hash": "#pipeline",
              "label": "IaC in the pipeline: plan → review → apply"
            },
            {
              "hash": "#testing",
              "label": "Testing, policy and drift"
            },
            {
              "hash": "#choosing",
              "label": "Bicep vs Terraform vs Pulumi"
            }
          ]
        },
        {
          "id": "observability-sre",
          "label": "Observability & SRE",
          "href": "topics/observability-sre.html",
          "blurb": "Logs, metrics and traces done properly: structured logging, OpenTelemetry in .NET and Python exported to Azure Monitor, the KQL queries you will actually run, alert rules and action groups without alert fatigue, SLIs/SLOs/error budgets, dashboards and workbooks, incident response and blameless postmortems, load and chaos testing.",
          "sections": [
            {
              "hash": "#pillars",
              "label": "Logs, metrics, traces — and structured logging"
            },
            {
              "hash": "#otel",
              "label": "OpenTelemetry → Azure Monitor"
            },
            {
              "hash": "#kql",
              "label": "KQL you will actually run"
            },
            {
              "hash": "#alerts",
              "label": "Alerts, action groups and avoiding fatigue"
            },
            {
              "hash": "#slo",
              "label": "SLIs, SLOs and error budgets"
            },
            {
              "hash": "#dashboards",
              "label": "Dashboards, workbooks and Grafana"
            },
            {
              "hash": "#incidents",
              "label": "Incident response, runbooks and postmortems"
            },
            {
              "hash": "#testing-resilience",
              "label": "Load testing and chaos engineering"
            }
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
