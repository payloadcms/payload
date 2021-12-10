import { Fields } from 'payload/dist/admin/components/forms/Form/types';

export const generateMetaImage = (fields: Fields): string => {
  let image;

  const heroType = fields?.['hero.type']?.value;

  if (heroType) {
    image = fields?.[`hero.${heroType}.media`]?.value;
  }

  return image;
};
