//Barrel File (arquivo que exporta tudo que tem dentro)
import { audioChunks } from './audio-chunks.ts';
import { questions } from './questions.ts';
import { rooms } from './rooms.ts';

export const schema = {
    rooms,
    questions,
    audioChunks
}