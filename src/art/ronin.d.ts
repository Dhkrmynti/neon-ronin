// Types for ronin.js, which stays plain JavaScript so the Node generator can import it without a build step.

export type Clan = "Ashigaru" | "Samurai" | "Shinobi" | "Sohei" | "Shogun" | "Ghost";
export type TraitKey = "Background" | "Armor" | "Head" | "Eyes" | "Neon" | "Helmet" | "Mask" | "Weapon" | "Accessory";
export type Traits = { Clan: Clan; Mon?: string } & Record<TraitKey, string>;
export type StatName = "Power" | "Defense" | "Honor" | "Stealth";
export type Stats = Record<StatName, number>;
export type Table = [string, number][];
export type LayerName = "background" | "back" | "weapon" | "body" | "head" | "eyes" | "mask" | "helmet" | "accessory";
export type Layers = Record<LayerName | "defs", string>;

export function hashSeed(str: string): () => number;
export function mulberry32(seed: number): () => number;
export function pick(table: Table, rng: () => number): string;
export function rollTraits(rng: () => number, clan?: Clan): Traits;
export function render(t: Traits, id: number | string, withBg?: boolean, seed?: string): string;
export function layers(t: Traits, id: number | string, seed?: string): Layers;
export function svg(inner: string): string;
export function stats(t: Traits, id: number | string): Stats;

export const CLANS: [Clan, number][];
export const T: Record<Clan, Record<Exclude<TraitKey, "Neon">, Table>>;
export const NEON: Record<string, string>;
export const NEON_TABLE: Table;
export const MON_TABLE: Table;
export const TRAIT_ORDER: ("Clan" | TraitKey)[];
export const LAYER_ORDER: LayerName[];
export const ARMOR: Record<string, string>;
export const METAL: Record<string, string>;
export const STAT_BASE: Record<StatName, [string, Record<string, number>]>;
