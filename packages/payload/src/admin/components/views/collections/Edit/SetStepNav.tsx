import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types.js';
import { getTranslation } from '../../../../../utilities/getTranslation.js';
import useTitle from '../../../../hooks/useTitle.js';
import { useStepNav } from '../../../elements/StepNav.js';
import { StepNavItem } from '../../../elements/StepNav/types.js';
import { useConfig } from '../../../utilities/Config.js';

export const SetStepNav: React.FC<{
  collection: SanitizedCollectionConfig
  isEditing: boolean
  id: string
}> = ({ collection, isEditing, id }) => {
  const {
    slug,
    labels: {
      plural: pluralLabel,
    },
    admin: {
      useAsTitle,
    },
  } = collection;

  const { setStepNav } = useStepNav();
  const { t, i18n } = useTranslation('general');
  const { routes: { admin } } = useConfig();

  const title = useTitle(collection);

  useEffect(() => {
    const nav: StepNavItem[] = [{
      url: `${admin}/collections/${slug}`,
      label: getTranslation(pluralLabel, i18n),
    }];

    if (isEditing) {
      nav.push({
        label: (useAsTitle && useAsTitle !== 'id') ? title || `[${t('untitled')}]` : id,
      });
    } else {
      nav.push({
        label: t('createNew'),
      });
    }

    setStepNav(nav);
  }, [setStepNav, isEditing, pluralLabel, id, slug, useAsTitle, admin, t, i18n, title]);

  return null;
};
