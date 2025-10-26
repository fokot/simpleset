# Simpleset

Imagine if [Superset](https://superset.apache.org/) was re-invented with
* AI-native dashboards and charts
  * Seamless LLM integration for query generation and visualization
  * Fully documented APIs and data models with Zod
* Built for embedding
  * Drop-in web component for any framework (React, Vue, and Angular etc.) or vanilla HTML
  * Hooks for enriching or transforming data after fetching
  * Easily extended backend with ability to load multiple data sources at once
* Effortless query & dashboard management
  * Version history stored in a database or Git
* Localization-ready
* Robust row-level security
* Fine-grained access rules per table

## Project structure
* .augment/rules - rules for LLMs
* api - API definition in [Zod](https://zod.dev/)
* backend - backend implementation in [Scala 3](https://scala-lang.org/)
* frontend - frontend implementation in [Lit](https://lit.dev/)


## Backend

* `/data/<dashboard>/<chart>` - async, load every chart data separately
* `/data-all/<dashboard>` - sync, load data for all charts on dashboard together
* `/data-ws/<dashboard>` - async, websocket for live updates, if you implement your own backend, you can group chart data as you want 