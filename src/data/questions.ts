import type { MsqQuestion } from '../types/academy';
import { QUESTIONS_PART_1 } from './questionsPart1';
import { QUESTIONS_PART_2 } from './questionsPart2';

export const QUESTIONS: MsqQuestion[] = [...QUESTIONS_PART_1, ...QUESTIONS_PART_2];
