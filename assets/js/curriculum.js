/* ==========================================================================
   curriculum.js — SINGLE SOURCE OF TRUTH for the sidebar and dashboard
   --------------------------------------------------------------------------
   One entry per major topic, in study order. `id` is the localStorage key
   for visited state — never rename an id once you have used the site.
   Loaded via <script src>, never fetch(), so the site works over file://.
   ========================================================================== */

window.CURRICULUM = {
  meta: { title: 'C# Learning Path', subtitle: 'Core to cloud · with Python alongside' },
  topics: [
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
    },
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
    }
  ]
};
