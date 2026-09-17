export const icons = {
    clock: [
        {tag: "circle", attrs: {cx: "12", cy: "12", r: "9"}},
        {tag: "path", attrs: {d: "M12 7v5l3 2"}},
    ],
    chevron: [{tag: "path", attrs: {d: "m9 5 7 7-7 7"}}],
    close: [{tag: "path", attrs: {d: "M6 6l12 12M18 6 6 18"}}],
    train: [
        {tag: "rect", attrs: {x: "5", y: "3", width: "14", height: "16", rx: "3"}},
        {tag: "path", attrs: {d: "M8 7h8M8 11h8M8 19l-2 2M16 19l2 2"}},
        {tag: "circle", attrs: {cx: "9", cy: "15", r: "1"}},
        {tag: "circle", attrs: {cx: "15", cy: "15", r: "1"}},
    ],
    settings: [
        {tag: "circle", attrs: {cx: "12", cy: "12", r: "3"}},
        {
            tag: "path",
            attrs: {
                d: "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z",
            },
        },
    ],
    key: [
        {tag: "circle", attrs: {cx: "8", cy: "15", r: "4"}},
        {tag: "path", attrs: {d: "m11 12 8-8M15 8l2 2M17 6l2 2"}},
    ],
    "external-link": [
        {
            tag: "path",
            attrs: {
                d: "M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5",
            },
        },
    ],
    eye: [
        {tag: "path", attrs: {d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"}},
        {tag: "circle", attrs: {cx: "12", cy: "12", r: "3"}},
    ],
    "map-pin": [
        {tag: "path", attrs: {d: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"}},
        {tag: "circle", attrs: {cx: "12", cy: "10", r: "2.5"}},
    ],
    plus: [{tag: "path", attrs: {d: "M12 5v14M5 12h14"}}],
    bookmark: [{tag: "path", attrs: {d: "M6 3h12v18l-6-4-6 4V3Z"}}],
    pencil: [
        {tag: "path", attrs: {d: "m4 20 4.5-1 10-10a2 2 0 0 0-3-3l-10 10L4 20Z"}},
        {tag: "path", attrs: {d: "m14.5 7.5 3 3"}},
    ],
    trash: [{tag: "path", attrs: {d: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"}}],
    walk: [
        {tag: "circle", attrs: {cx: "13", cy: "4", r: "2"}},
        {tag: "path", attrs: {d: "m10 21 2-7-3-3 2-4 4 3 3 1M12 14l4 3 1 4M9 11l-4 2"}},
    ],
} as const;

export type IconName = keyof typeof icons;
