# Requirements Document

## Introduction

既存のbolt-cepプロジェクト（com.layer-note.cep）を拡張し、レイヤーコメント編集、一時メモ機能、エクスプレッション編集の強化を提供するVSCodeライクなコードエディタ機能を開発します。ReactベースのパネルUI（src/js）とAfter Effects JSX拡張（src/jsx）を活用し、開発者がAfter Effects内でより効率的にスクリプトやエクスプレッションを編集できるようにし、コード品質の向上とワークフローの改善を目指します。

## Requirements

### Requirement 1

**User Story:** As an After Effects user, I want to edit layer comments in a dedicated editor interface, so that I can manage layer documentation more efficiently.

#### Acceptance Criteria

1. WHEN user selects a layer in After Effects THEN React panel SHALL display current comment content in the editor
2. WHEN user modifies comment text in React editor THEN system SHALL communicate changes to JSX layer via CEP bridge
3. WHEN user saves changes THEN JSX extension SHALL persist the comment to the After Effects project file
4. IF layer has no existing comment THEN React panel SHALL allow creation of new comment
5. WHEN multiple layers are selected THEN React panel SHALL display comments for all selected layers in tabbed interface
6. WHEN layer selection changes THEN system SHALL automatically sync editor content with selected layer

### Requirement 2

**User Story:** As an After Effects user, I want to create and manage temporary notes, so that I can keep track of ideas and reminders during my work session.

#### Acceptance Criteria

1. WHEN user creates a new note THEN React panel SHALL store it in local component state and CEP persistent storage
2. WHEN user closes After Effects THEN system SHALL automatically save notes to CEP persistent storage
3. WHEN user reopens the extension THEN React panel SHALL restore previously saved notes from CEP storage
4. WHEN user deletes a note THEN system SHALL remove it from both component state and persistent storage
5. IF user wants to organize notes THEN React panel SHALL provide categorization with drag-and-drop interface
6. WHEN notes exceed panel space THEN system SHALL provide scrollable interface with search functionality

### Requirement 3

**User Story:** As an After Effects user, I want to edit expressions with VSCode-like features, so that I can write more complex and error-free expressions efficiently.

#### Acceptance Criteria

1. WHEN user opens expression editor THEN React panel SHALL display current expression code with Monaco Editor syntax highlighting
2. WHEN user types code THEN Monaco Editor SHALL provide real-time syntax highlighting for JavaScript/After Effects expressions
3. WHEN user presses Tab THEN Monaco Editor SHALL provide intelligent code completion with After Effects API suggestions
4. WHEN user saves expression THEN JSX extension SHALL apply the expression to the selected property via After Effects DOM
5. IF expression has syntax errors THEN Monaco Editor SHALL highlight errors with descriptive messages and line numbers
6. WHEN user switches between properties THEN React panel SHALL load corresponding expression content automatically

### Requirement 4

**User Story:** As an After Effects user, I want code formatting capabilities, so that my expressions are consistently formatted and readable.

#### Acceptance Criteria

1. WHEN user triggers format command THEN Monaco Editor SHALL format the current expression using integrated Prettier formatter
2. WHEN user enables auto-format THEN system SHALL automatically format code on save via Monaco Editor actions
3. WHEN formatting is applied THEN system SHALL maintain expression functionality while improving readability
4. IF code cannot be formatted THEN React panel SHALL display appropriate warning message with format error details
5. WHEN user configures format settings THEN system SHALL persist preferences in CEP storage for future sessions

### Requirement 5

**User Story:** As an After Effects user, I want linting capabilities, so that I can identify and fix potential issues in my expressions before applying them.

#### Acceptance Criteria

1. WHEN user writes expression code THEN Monaco Editor SHALL analyze code for common errors and warnings using custom language service
2. WHEN linting issues are found THEN Monaco Editor SHALL display inline error markers and squiggly underlines
3. WHEN user hovers over error markers THEN Monaco Editor SHALL show detailed error information in tooltip
4. IF expression uses deprecated After Effects functions THEN custom linter SHALL warn user with modern alternatives
5. WHEN user fixes linting issues THEN Monaco Editor SHALL update error markers in real-time
6. WHEN linting rules are updated THEN system SHALL persist custom rule configurations in CEP storage

### Requirement 6

**User Story:** As an After Effects user, I want search and replace functionality, so that I can efficiently modify expressions across multiple properties or projects.

#### Acceptance Criteria

1. WHEN user opens search dialog THEN Monaco Editor SHALL provide built-in search widget with regex support
2. WHEN user performs search THEN Monaco Editor SHALL highlight all matches in the current expression with navigation controls
3. WHEN user performs replace THEN Monaco Editor SHALL replace selected matches with specified text
4. WHEN user enables replace all THEN Monaco Editor SHALL replace all matches in current expression with confirmation
5. IF search spans multiple expressions THEN React panel SHALL provide project-wide search across all layer expressions via JSX bridge
6. WHEN user uses regex patterns THEN Monaco Editor SHALL validate pattern syntax and show match preview
7. WHEN project-wide search is performed THEN JSX extension SHALL collect all expressions and return results to React panel

### Requirement 7

**User Story:** As an After Effects user, I want the editor interface to be intuitive and responsive, so that I can focus on creative work without technical barriers.

#### Acceptance Criteria

1. WHEN extension loads THEN React panel SHALL display within 2 seconds with loading indicators
2. WHEN user switches between editor modes THEN React state management SHALL preserve unsaved changes
3. WHEN user resizes editor panel THEN CSS Grid/Flexbox layout SHALL maintain responsive proportions
4. IF system encounters errors THEN React error boundaries SHALL display user-friendly error messages with recovery options
5. WHEN user performs undo/redo THEN Monaco Editor SHALL maintain complete edit history with keyboard shortcuts
6. WHEN extension updates THEN CEP persistent storage SHALL preserve user preferences and settings across versions
7. WHEN CEP bridge communication fails THEN React panel SHALL display connection status and retry mechanisms
