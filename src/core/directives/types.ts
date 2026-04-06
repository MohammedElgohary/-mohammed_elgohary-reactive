/**
 * Directive Types
 */

export interface DirectiveContext {
  el: Element;
  value: string;
  scope: Record<string, any>;
  names: string[];
  nameRegexes: Map<string, RegExp>;
  walkTree: (
    root: Element | Document,
    scope: Record<string, any>,
    names: string[],
    nameRegexes: Map<string, RegExp>,
  ) => () => void;
  buildNameRegexes: (names: string[]) => Map<string, RegExp>;
}
