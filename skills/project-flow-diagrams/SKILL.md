---
name: project-flow-diagrams
description: 프로젝트 소스의 실제 실행 조건, 분기, 결과를 분석해 Project Flow Viewer용 Mermaid diagrams.md를 생성하거나 갱신할 때 사용한다. 특정 언어, 프레임워크, AI 공급자에 종속되지 않는다.
---

# Project Flow Diagrams

사용자가 지정한 프로젝트만 읽고, 이 저장소의 [`prompts/generate-diagrams.md`](../../prompts/generate-diagrams.md)를 끝까지 따른다.

## 작업 기준

- 대상 프로젝트의 언어와 프레임워크를 먼저 확인하고 실제 진입점부터 추적한다.
- 출력 경로가 지정되지 않으면 대상 프로젝트 루트의 `diagrams.md`를 사용한다.
- 기존 파일을 갱신할 때 분석 범위 밖의 유효한 섹션을 보존한다.
- 특정 AI 도구나 CLI가 있다고 가정하지 않는다. 현재 환경에서 가능한 읽기·쓰기 도구를 사용한다.
- 소스 분석과 문서 생성만 수행한다. 사용자가 별도로 요청하지 않은 코드 실행, 배포, 외부 시스템 변경은 하지 않는다.
- 생성 후 공통 명세의 완료 검증을 수행하고 변경한 섹션과 미확인 영역을 보고한다.
