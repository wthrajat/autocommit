export type CommitType = 
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'build'
  | 'ci'
  | 'chore'
  | 'revert';

export interface CommitOptions {
  type: CommitType | null;
  diff: string;
}

export type ActionType = 'accept' | 'edit' | 'regenerate' | 'quit';
