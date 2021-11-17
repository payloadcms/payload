import { Fields } from 'payload/dist/admin/components/forms/Form/types';

export const generateMetaImage = (fields: Fields): string => {
  let image;

  const hero = fields?.hero as any;

  if (hero) {
    if (hero?.type === 'contentMedia') {
      if (typeof hero?.contentMedia?.media === 'string') {
        image = hero.contentMedia.media;
      }

      if (typeof hero?.contentMedia?.media?.id === 'string') {
        image = hero.contentMedia.media.id;
      }
    }

    if (hero?.type === 'fullscreenBackground') {
      if (typeof hero?.fullscreenBackground?.backgroundMedia === 'string') {
        image = hero.fullscreenBackground.backgroundMedia;
      }

      if (typeof hero?.fullscreenBackground?.backgroundMedia?.id === 'string') {
        image = hero.fullscreenBackground.backgroundMedia.id;
      }
    }

    if (hero?.type === 'fullscreenSlider') {
      if (typeof hero?.fullscreenSlider?.slides?.[0]?.backgroundMedia === 'string') {
        image = hero.fullscreenSlider.slides[0].backgroundMedia;
      }

      if (typeof hero?.fullscreenSlider?.slides?.[0]?.backgroundMedia?.id === 'string') {
        image = hero.fullscreenSlider.slides[0].backgroundMedia.id;
      }
    }

    if (hero?.type === 'columnsBelow') {
      if (typeof hero?.columnsBelow?.backgroundMedia === 'string') {
        image = hero.columnsBelow.backgroundMedia;
      }

      if (typeof hero?.columnsBelow?.backgroundMedia?.id === 'string') {
        image = hero.columnsBelow.backgroundMedia.id;
      }
    }

    if (hero?.type === 'quickNav') {
      if (typeof hero?.quickNav?.backgroundMedia === 'string') {
        image = hero.quickNav.backgroundMedia;
      }

      if (typeof hero?.quickNav?.backgroundMedia?.id === 'string') {
        image = hero.quickNav.backgroundMedia.id;
      }
    }
  }

  return image;
};
