export const models = {
    desk: {
        name: 'Angel',
        title: "Desk",
        description: "This became most of my word.",
        filepath: "/cemetery_angel_-_miller/scene.gltf",
        latHiLng: [47.5917721, 1, 19.3865678] as [number, number, number],
    },
};

export type LocationKey = keyof typeof models;
