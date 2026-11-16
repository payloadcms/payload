# Shared tree presentation

Internal presentation for hierarchical rows inside an existing table or list. These components own disclosure styling and decorative connectors. Callers own data, identity, loading, translations, navigation, selection and document actions.

`TreeItem` accepts children, a visual position and optional disclosure state. Expandable rows require a translated `toggleLabel`; `onToggle` supplies their action. The loading spinner appears after 200 ms while an expanded row is pending. `parentDescription` can add screen-reader context. The enclosing view provides native table/list semantics and keyboard navigation; these components do not implement an ARIA tree widget.

`TreePosition` describes visual columns:

- `indent`: incoming connector column.
- `ancestorContinues`: preceding columns whose rails continue, including the root at index 0.
- `isLastSibling`: stop the outgoing rail after this subtree, accounting for following groups and continuation rows.
- `isLastRendered`: end all rails at the final visible row's midpoint.

Variants:

- `default`: opening a branch adds a child stem and changes its outgoing continuation to a dashed rail.
- `group`: centers the disclosure on the current rail; content may remain in that visual column.
- `continuation`: extends the horizontal arm for summaries and paging actions.

`getTreeConnectorSegments` computes the decorative segments independently of document or collection models. `TreeConnectors` renders them with one horizontal arm and separate incoming/outgoing strokes. Connector elements are hidden from assistive technology.

The enclosing positioned cell supplies the containing block. `--tree-gutter`, `--tree-indent` and `--tree-ghost-line-opacity` customize presentation using the existing spacing and color tokens. RTL positions use logical properties; reduced-motion styling stops the loading animation.

Consumer adapters should calculate positions from their visible rows. Document IDs are not occurrence keys for a graph with repeated references: identity, path-local cycle handling, authorization, cache ownership and transport remain outside this presentation layer. Integration and browser verification belong to the consuming views.
