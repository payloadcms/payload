import { canAccessAdmin } from 'payload';
export const schedulePublishHandler = async ({
  type,
  date,
  deleteID,
  doc,
  global,
  locale,
  req,
  timezone
}) => {
  const {
    i18n,
    payload,
    user
  } = req;
  await canAccessAdmin({
    req
  });
  try {
    if (deleteID) {
      await payload.delete({
        collection: 'payload-jobs',
        req,
        where: {
          id: {
            equals: deleteID
          }
        }
      });
    }
    await payload.jobs.queue({
      input: {
        type,
        doc,
        global,
        locale,
        timezone,
        user: user.id
      },
      task: 'schedulePublish',
      waitUntil: date
    });
  } catch (err) {
    let error;
    if (deleteID) {
      error = `Error deleting scheduled publish event with ID ${deleteID}`;
    } else {
      error = `Error scheduling ${type} for `;
      if (doc) {
        error += `document with ID ${doc.value} in collection ${doc.relationTo}`;
      }
    }
    payload.logger.error(error);
    payload.logger.error(err);
    return {
      error
    };
  }
  return {
    message: i18n.t('general:success')
  };
};
//# sourceMappingURL=schedulePublishHandler.js.map