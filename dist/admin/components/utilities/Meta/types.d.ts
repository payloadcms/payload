export type Meta = {
    property: string;
    content: string;
};
export type Props = {
    title: string;
    description?: string;
    lang?: string;
    meta?: Meta[];
    image?: string;
    keywords?: string;
};
