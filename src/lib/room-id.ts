import { customAlphabet } from "nanoid";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const generator = customAlphabet(ALPHABET, 6);

export function newRoomId(): string {
  return generator();
}
