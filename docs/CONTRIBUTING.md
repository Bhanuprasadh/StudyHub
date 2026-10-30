# 🤝 Contributing to StudyHub

Thank you for contributing to the StudyHub Academic Learning Platform.

---

## 1. Development Workflow

1. **Fork & Branch**: Create a feature branch with a descriptive name (`feature/xyz`, `bugfix/xyz`, `docs/xyz`).
2. **Environment**: Use Docker Compose (`docker compose up -d`) or local virtual environment.
3. **Coding Standards**:
   - Python code must conform to PEP 8 and Python 3.12+ standards.
   - React components must follow functional component conventions with hooks.
   - Use CSS variables from the StudyHub design system (`--primary`, `--bg-card`, etc.).
4. **Testing Requirements**:
   - Every backend feature must have associated Pytest tests.
   - Frontend changes must not break Vitest suites or Vite production build.
5. **Quality Gates**:
   - `python -m pytest tests/` must pass 100%.
   - `npx vitest run` and `npm run build` in `frontend` must pass 100%.
