# Weekly Progress Report

---

**Name:** Akarsh Shrivastav
**Roll No.:** 24CSE1002
**Supervisor's Name:** Dr. Keshavamurthy B.N
**Reporting Period:** 11/09/2026 – 18/09/2026

---

## Progress Summary

During the reporting period 11/09/2026 – 18/09/2026, substantive progress was made across both seminar implementation tracks. The first implementation addresses the architectural evolution of browser-based Cross-Site Scripting (XSS) defenses, with a particular focus on DOM-based XSS vectors and the W3C Trusted Types specification. The second implementation delivers a complete, reproducible Machine Learning classification pipeline constructed around the Titanic survival prediction task, exercising core scikit-learn abstractions from data ingestion through model persistence.

### Implementation 1 — DOM XSS & Trusted Types

A Node.js/Express web application was architected to expose two semantically identical routes — `/vulnerable` and `/secure` — that both consume URL query-string parameters (`id`, `name`) and write their concatenated values into the DOM via a `document.write()`-equivalent sink (`innerHTML`). The vulnerable route relies exclusively on a client-side legacy string-matching sanitizer that performs case-insensitive regular-expression replacement of contiguous `<script>` tags. This filter was deliberately designed to be bypassable: because `document.write()` concatenates two independently filtered parameters, an attacker can distribute the opening `<script>` tag across the `id` and `name` values (i.e., `id=<scr` and `name=ipt>alert('XSS')</script>`), causing each fragment to evade the filter individually while reassembling into a valid script injection upon concatenation — a technique documented as the "Double-Injection" bypass.

The secure route mitigates this entire class of attack at the browser engine level. The Express server attaches a `Content-Security-Policy` response header containing `require-trusted-types-for 'script'` and `trusted-types dompurify-policy`, which instructs the browser to reject any raw string argument to dangerous sinks (innerHTML, document.write, eval, setTimeout with string arguments, etc.) unless it is wrapped in a `TrustedHTML`, `TrustedScript`, or `TrustedScriptURL` object. A single named policy — `dompurify-policy` — is registered via `trustedTypes.createPolicy()`, and its `createHTML()` callback delegates sanitization to DOMPurify (loaded from CDN), which strips all tags and attributes not present in an explicit allowlist. This architecture ensures that even if the Double-Injection payload reassembles a complete `<script>` tag, DOMPurify excises it before the Trusted Types wrapper is returned, and the browser's enforcement layer provides a fail-closed guarantee independent of application logic.

### Implementation 2 — Survival Classification Estimator

A Jupyter Notebook was constructed implementing an end-to-end supervised classification pipeline using the Titanic survival dataset loaded via Seaborn's built-in dataset API. The pipeline begins with exploratory data analysis (EDA) comprising correlation heatmaps of numeric features, survival-stratified histograms of age and fare distributions, and count plots disaggregated by passenger class, sex, and embarkation port.

Feature engineering and preprocessing are encapsulated in a scikit-learn `ColumnTransformer` that applies distinct sub-pipelines to numeric and categorical feature groups. Numeric features (`age`, `fare`, `sibsp`, `parch`) pass through a `SimpleImputer` (median strategy) followed by a `StandardScaler`; categorical features (`sex`, `embarked`, `pclass`, `alone`) pass through a `SimpleImputer` (most-frequent strategy) followed by a `OneHotEncoder` with `drop='first'` to eliminate collinearity. This transformer is fit exclusively on the training partition (80/20 stratified split, `random_state=42`), ensuring zero information leakage from the test set.

Two baseline classifiers — `LogisticRegression` and `DecisionTreeClassifier` — are evaluated via 10-fold stratified cross-validation, with accuracy as the scoring metric. A `RandomForestClassifier` is subsequently subjected to exhaustive hyperparameter search via `GridSearchCV` over a four-dimensional grid (`n_estimators`, `max_depth`, `min_samples_split`, `min_samples_leaf`), totalling 108 configurations × 10 folds = 1,080 fits. The best estimator is evaluated on the untouched test partition, producing a full classification report, confusion matrix, and ROC-AUC curve. Finally, the best pipeline (preprocessor + classifier) is serialized to disk via `joblib.dump()` and verified through a reload-and-predict cycle.

---

## Tasks Completed This Week

- **[Project 1]** Designed and implemented a Node.js/Express web server (`server.js`) with static file serving and two routes (`/vulnerable`, `/secure`) delivering distinct HTML pages.
- **[Project 1]** Built a vulnerable HTML page (`vulnerable.html`) with a `document.write()`-equivalent sink that concatenates two URL query-string parameters, demonstrating the DOM XSS attack surface.
- **[Project 1]** Implemented a legacy client-side string-matching sanitizer using case-insensitive regex replacement of `<script>` tags, and documented its bypass via the Double-Injection technique.
- **[Project 1]** Implemented a secure HTML page (`secure.html`) enforcing the `Content-Security-Policy: require-trusted-types-for 'script'; trusted-types dompurify-policy` header from the server, with a client-side `trustedTypes.createPolicy()` callback backed by DOMPurify sanitization.
- **[Project 1]** Included a browser fallback path for user agents that do not yet support the Trusted Types API, using DOMPurify directly as a degraded defense layer.
- **[Project 2]** Loaded the Titanic survival dataset and performed exploratory data analysis including survival-stratified count plots, age/fare distribution histograms, and a triangular correlation heatmap.
- **[Project 2]** Constructed a `ColumnTransformer` preprocessing pipeline with `SimpleImputer` (median for numeric, most-frequent for categorical), `StandardScaler`, and `OneHotEncoder` (with first-category drop).
- **[Project 2]** Performed a stratified 80/20 train-test split preserving the ~38% survival class ratio across partitions.
- **[Project 2]** Evaluated `LogisticRegression` and `DecisionTreeClassifier` baselines using 10-fold stratified cross-validation, comparing mean accuracy and standard deviation.
- **[Project 2]** Executed `GridSearchCV` on a `RandomForestClassifier` over 108 hyperparameter combinations (1,080 total fits), identified the optimal configuration, and evaluated on the held-out test set.
- **[Project 2]** Generated confusion matrix, ROC curve, and feature importance visualizations for the tuned Random Forest model.
- **[Project 2]** Persisted the best pipeline to disk using `joblib` and verified prediction reproducibility through a reload cycle.

---

## Additional Notes

An instructive parallel exists between the two implementations that underscores a shared foundational principle: **strict isolation of untrusted input**. In the web security domain (Project 1), the Trusted Types specification enforces an architectural boundary between untrusted user-supplied strings and dangerous DOM sinks — any data that has not been explicitly sanitized through a registered policy is rejected by the browser engine before it can affect the execution context. The legacy string-matching filter fails precisely because it lacks this architectural enforcement: it inspects each parameter in isolation, permitting a split payload to reassemble after concatenation.

In the machine learning domain (Project 2), an analogous isolation boundary exists between the training and test partitions. The `ColumnTransformer` is fit exclusively on training data; if imputation statistics (median, mode) or scaling parameters (mean, variance) were computed on the full dataset prior to splitting, the test set would leak distributional information into the training phase — a violation known as data leakage that inflates reported metrics and undermines generalization guarantees. Stratified splitting further ensures that the class distribution is preserved across both partitions, preventing sampling bias from distorting evaluation.

In both cases, the robustness of the system depends not on the sophistication of the processing logic itself, but on the **integrity of the trust boundary** that separates clean/trusted data from raw/untrusted input.

---

## Projects Summary

**Project 1 — DOM XSS & Trusted Types Defense:**
A Node.js/Express web application demonstrating the evolution from legacy string-matching XSS filters to the W3C Trusted Types specification. The application includes a vulnerable page with a document.write sink and a bypassable regex filter, alongside a secure page enforcing Content Security Policy with `require-trusted-types-for 'script'` and a DOMPurify-backed Trusted Types policy.

**Project 2 — Survival Classification Estimator:**
An end-to-end scikit-learn classification pipeline implemented in a Jupyter Notebook. The pipeline loads the Titanic survival dataset, performs exploratory data analysis, preprocesses features via a ColumnTransformer (imputation, scaling, encoding), compares Logistic Regression and Decision Tree baselines with 10-fold cross-validation, tunes a Random Forest via GridSearchCV, evaluates on a held-out test set, and persists the best model with joblib.

**Repository:** [https://github.com/DarkGokuZ/seminar-implementation.git](https://github.com/DarkGokuZ/seminar-implementation.git)

---
