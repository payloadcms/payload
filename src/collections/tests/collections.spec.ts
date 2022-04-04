import { v4 as uuid } from 'uuid';
import getConfig from '../../config/load';
import { email, password } from '../../mongoose/testCredentials';

require('isomorphic-fetch');

const { serverURL: url } = getConfig();

let token = null;
let headers = null;

let localizedPostID;
const localizedPostTitle = 'title';
const englishPostDesc = 'english description';
const spanishPostDesc = 'spanish description';

describe('Collections - REST', () => {
  beforeAll(async (done) => {
    const response = await fetch(`${url}/api/admins/login`, {
      body: JSON.stringify({
        email,
        password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'post',
    });

    const data = await response.json();

    ({ token } = data);
    headers = {
      Authorization: `JWT ${token}`,
      'Content-Type': 'application/json',
    };

    done();
  });

  describe('Create', () => {
    let response;
    let data;

    beforeAll(async () => {
      response = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: localizedPostTitle,
          description: englishPostDesc,
          priority: 1,
          nonLocalizedGroup: {
            text: 'english',
          },
          localizedGroup: {
            text: 'english',
          },
          nonLocalizedArray: [
            {
              localizedEmbeddedText: 'english',
            },
          ],
          richTextBlocks: [
            {
              blockType: 'richTextBlock',
              blockName: 'Test Block Name',
              content: [
                {
                  children: [{ text: 'english' }],
                },
              ],
            },
          ],
        }),
        headers,
        method: 'post',
      });
      data = await response.json();
    });

    it('should allow a localized post to be created', async () => {
      expect(response.status).toBe(201);
      expect(data.doc.title).toBeDefined();
      expect(data.doc.id).toBeDefined();
      expect(data.doc.nonLocalizedGroup.text).toStrictEqual('english');
      expect(data.doc.localizedGroup.text).toStrictEqual('english');
      expect(data.doc.nonLocalizedArray[0].localizedEmbeddedText).toStrictEqual('english');
      expect(data.doc.richTextBlocks[0].content[0].children[0].text).toStrictEqual('english');

      const timestampRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/;
      expect(data.doc.createdAt).toStrictEqual(expect.stringMatching(timestampRegex));
      expect(data.doc.updatedAt).toStrictEqual(expect.stringMatching(timestampRegex));

      localizedPostID = data.doc.id;
    });

    it('should add id to array items', async () => {
      expect(data.doc.nonLocalizedArray[0].id).toBeDefined();
    });

    it('should add id to block items', async () => {
      expect(data.doc.richTextBlocks[0].id).toBeDefined();
    });
  });

  describe('Update', () => {
    it('should allow updating an existing post', async () => {
      const createResponse = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: 'newTitle',
          description: 'original description',
          richText: [
            {
              children: [{ text: 'english' }],
            },
          ],
          priority: 1,
        }),
        headers,
        method: 'post',
      });

      expect(createResponse.status).toBe(201);
      const createData = await createResponse.json();
      const { id } = createData.doc;

      const updatedDesc = 'updated description';
      const updatedRichText = [
        {
          children: [{ text: 'english update' }],
        },
      ];
      const updatedNonLocalizedArray = [
        {
          localizedEmbeddedText: 'english',
        },
        {
          localizedEmbeddedText: 'english update',
        },
      ];
      const response = await fetch(`${url}/api/localized-posts/${id}`, {
        body: JSON.stringify({
          title: 'newTitle',
          description: updatedDesc,
          richText: updatedRichText,
          nonLocalizedArray: updatedNonLocalizedArray,
          priority: '',
        }),
        headers,
        method: 'put',
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.doc.description).toBe(updatedDesc);
      expect(data.doc.priority).not.toStrictEqual(1);
      expect(data.doc.nonLocalizedArray).toHaveLength(2);
      expect(data.doc.richText[0].children[0].text).toBe('english update');

      // make certain the stored object is exactly the same as the returned object
      const stored = await (
        await fetch(`${url}/api/localized-posts/${id}`, {
          method: 'get',
          headers,
        })
      ).json();

      expect(data.doc).toMatchObject(stored);
    });

    it('should allow a Spanish locale to be added to an existing post', async () => {
      const response = await fetch(`${url}/api/localized-posts/${localizedPostID}?locale=es`, {
        body: JSON.stringify({
          title: 'title in spanish',
          description: spanishPostDesc,
          priority: 1,
          nonLocalizedGroup: {
            text: 'spanish',
          },
          localizedGroup: {
            text: 'spanish',
          },
          nonLocalizedArray: [
            {
              localizedEmbeddedText: 'spanish',
            },
          ],
          richTextBlocks: [
            {
              blockType: 'richTextBlock',
              blockName: 'Test Block Name',
              content: [
                {
                  children: [{ text: 'spanish' }],
                },
              ],
            },
          ],
        }),
        headers,
        method: 'put',
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.doc.description).toBe(spanishPostDesc);
      expect(data.doc.nonLocalizedGroup.text).toStrictEqual('spanish');
      expect(data.doc.localizedGroup.text).toStrictEqual('spanish');
      expect(data.doc.nonLocalizedArray[0].localizedEmbeddedText).toStrictEqual('spanish');
      expect(data.doc.richTextBlocks[0].content[0].children[0].text).toStrictEqual('spanish');
    });
  });

  describe('Read', () => {
    describe('Localized', () => {
      it('should allow a localized post to be retrieved in unspecified locale, defaulting to English', async () => {
        const response = await fetch(`${url}/api/localized-posts/${localizedPostID}`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.description).toBe(englishPostDesc);
        expect(data.nonLocalizedGroup.text).toStrictEqual('english');
        expect(data.localizedGroup.text).toStrictEqual('english');
        expect(data.nonLocalizedArray[0].localizedEmbeddedText).toStrictEqual('english');
        expect(data.richTextBlocks[0].content[0].children[0].text).toStrictEqual('english');
      });

      it('should allow a localized post to be retrieved in specified English locale', async () => {
        const response = await fetch(`${url}/api/localized-posts/${localizedPostID}?locale=en`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.description).toBe(englishPostDesc);
        expect(data.nonLocalizedGroup.text).toStrictEqual('english');
        expect(data.localizedGroup.text).toStrictEqual('english');
        expect(data.nonLocalizedArray[0].localizedEmbeddedText).toStrictEqual('english');
        expect(data.richTextBlocks[0].content[0].children[0].text).toStrictEqual('english');
      });

      it('should allow a localized post to be retrieved in Spanish', async () => {
        const response = await fetch(`${url}/api/localized-posts/${localizedPostID}?locale=es`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.description).toBe(spanishPostDesc);
        expect(data.nonLocalizedGroup.text).toStrictEqual('spanish');
        expect(data.localizedGroup.text).toStrictEqual('spanish');
        expect(data.nonLocalizedArray[0].localizedEmbeddedText).toStrictEqual('spanish');
        expect(data.richTextBlocks[0].content[0].children[0].text).toStrictEqual('spanish');
      });

      it('should allow a localized post to be retrieved in all locales', async () => {
        const response = await fetch(`${url}/api/localized-posts/${localizedPostID}?locale=all`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.description.es).toBe(spanishPostDesc);
        expect(data.description.en).toBe(englishPostDesc);
      });
    });

    it('should allow querying by id', async () => {
      const response = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: 'another title',
          description: 'description',
          priority: 1,
        }),
        headers,
        method: 'post',
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      const getResponse = await fetch(`${url}/api/localized-posts/${data.doc.id}`);

      expect(getResponse.status).toBe(200);

      const getData = await getResponse.json();

      expect(getData.id).toBeDefined();
    });

    it('should allow querying on a field', async () => {
      const desc = 'query test';
      const response = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: 'unique title here',
          description: desc,
          priority: 1,
          nonLocalizedGroup: {
            text: 'sample content',
          },
        }),
        headers,
        method: 'post',
      });

      expect(response.status).toBe(201);
      const getResponse = await fetch(
        `${url}/api/localized-posts?where[description][equals]=${desc}`,
      );
      const data = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(data.docs[0].description).toBe(desc);
      expect(data.docs).toHaveLength(1);

      const getResponse2 = await fetch(
        `${url}/api/localized-posts?where[nonLocalizedGroup.text][equals]=sample content`,
      );
      const data2 = await getResponse2.json();

      expect(getResponse2.status).toBe(200);
      expect(data2.docs[0].description).toBe(desc);
      expect(data2.docs).toHaveLength(1);
    });

    it('should allow querying with OR', async () => {
      const title1 = 'Or1';
      const title2 = 'Or2';
      const response = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: title1,
          description: 'desc',
          priority: 1,
        }),
        headers,
        method: 'post',
      });

      const response2 = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: title2,
          description: 'desc',
          priority: 1,
        }),
        headers,
        method: 'post',
      });

      expect(response.status).toBe(201);
      expect(response2.status).toBe(201);

      const queryResponse = await fetch(
        `${url}/api/localized-posts?where[or][0][title][equals]=${title1}&where[or][1][title][equals]=${title2}`,
      );
      const data = await queryResponse.json();

      expect(queryResponse.status).toBe(200);
      expect(data.docs).toHaveLength(2);
      expect(data.docs).toContainEqual(expect.objectContaining({ title: title1 }));
      expect(data.docs).toContainEqual(expect.objectContaining({ title: title2 }));
    });

    it('should allow querying with OR, 1 result', async () => {
      const title1 = 'OrNegative1';
      const title2 = 'OrNegative2';
      const response = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: title1,
          description: 'desc',
          priority: 1,
        }),
        headers,
        method: 'post',
      });

      const response2 = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: title2,
          description: 'desc',
          priority: 1,
        }),
        headers,
        method: 'post',
      });

      expect(response.status).toBe(201);
      expect(response2.status).toBe(201);

      const queryResponse = await fetch(
        `${url}/api/localized-posts?where[or][0][title][equals]=${title1}&where[or][1][title][equals]=nonexistent`,
      );
      const data = await queryResponse.json();

      expect(queryResponse.status).toBe(200);
      expect(data.docs).toHaveLength(1);
      expect(data.docs[0].title).toBe(title1);
    });

    it('should allow querying by a non-localized nested relationship property', async () => {
      const relationshipBTitle = 'test';
      const relationshipBRes = await fetch(`${url}/api/relationship-b?depth=0`, {
        body: JSON.stringify({
          title: relationshipBTitle,
        }),
        headers,
        method: 'post',
      });

      const relationshipBData = await relationshipBRes.json();

      const res = await fetch(`${url}/api/relationship-a?depth=0`, {
        body: JSON.stringify({
          post: relationshipBData.doc.id,
        }),
        headers,
        method: 'post',
      });

      const additionalRelationshipARes = await fetch(`${url}/api/relationship-a?depth=0`, {
        body: JSON.stringify({
          postLocalizedMultiple: [
            {
              relationTo: 'localized-posts',
              value: localizedPostID,
            },
          ],
        }),
        headers,
        method: 'post',
      });

      const relationshipAData = await res.json();

      expect(res.status).toBe(201);
      expect(additionalRelationshipARes.status).toBe(201);
      expect(relationshipAData.doc.post).toBe(relationshipBData.doc.id);

      const queryRes = await fetch(
        `${url}/api/relationship-a?where[post.title][equals]=${relationshipBTitle}`,
      );
      const data = await queryRes.json();

      expect(data.docs).toHaveLength(1);
    });

    it('should allow querying by a localized nested relationship property', async () => {
      const res = await fetch(`${url}/api/relationship-a`, {
        body: JSON.stringify({
          LocalizedPost: [localizedPostID],
        }),
        headers,
        method: 'post',
      });

      expect(res.status).toBe(201);

      const queryRes1 = await fetch(
        `${url}/api/relationship-a?where[LocalizedPost.title][in]=${localizedPostTitle}`,
      );
      const data1 = await queryRes1.json();

      expect(data1.docs).toHaveLength(1);
    });

    it('should allow querying by a localized nested relationship with many relationTos', async () => {
      const relationshipBTitle = 'lawleifjawelifjew';
      const relationshipB = await fetch(`${url}/api/relationship-b?depth=0`, {
        body: JSON.stringify({
          title: relationshipBTitle,
        }),
        headers,
        method: 'post',
      }).then((res) => res.json());

      expect(relationshipB.doc.id).toBeDefined();

      const res = await fetch(`${url}/api/relationship-a`, {
        body: JSON.stringify({
          postManyRelationships: {
            value: relationshipB.doc.id,
            relationTo: 'relationship-b',
          },
        }),
        headers,
        method: 'post',
      });

      expect(res.status).toBe(201);

      const queryRes = await fetch(
        `${url}/api/relationship-a?where[postManyRelationships.value][equals]=${relationshipB.doc.id}`,
      );
      const data = await queryRes.json();
      expect(data.docs).toHaveLength(1);
    });

    it('should allow querying by a non-localized relationship with many relationTos', async () => {
      const relationshipB = await fetch(`${url}/api/relationship-b?depth=0`, {
        body: JSON.stringify({
          title: 'awefjlaiwejfalweiijfaew',
          nonLocalizedRelationToMany: {
            relationTo: 'localized-posts',
            value: localizedPostID,
          },
        }),
        headers,
        method: 'post',
      }).then((res) => res.json());

      expect(relationshipB.doc.id).toBeDefined();

      const queryRes = await fetch(
        `${url}/api/relationship-b?where[nonLocalizedRelationToMany.value][equals]=${localizedPostID}`,
      );
      const data = await queryRes.json();
      expect(data.docs).toHaveLength(1);
    });

    it('should allow querying by a numeric custom ID', async () => {
      const customID = 1988;

      const customIDResult = await fetch(`${url}/api/custom-id?depth=0`, {
        body: JSON.stringify({
          id: customID,
          name: 'woohoo',
        }),
        headers,
        method: 'post',
      }).then((res) => res.json());

      expect(customIDResult.doc.id).toStrictEqual(customID);

      await fetch(`${url}/api/custom-id?depth=0`, {
        body: JSON.stringify({
          id: 2343452,
          name: 'another post',
        }),
        headers,
        method: 'post',
      }).then((res) => res.json());

      const queryRes1 = await fetch(`${url}/api/custom-id?where[id][equals]=${customID}`, {
        headers,
      });

      const data1 = await queryRes1.json();

      expect(data1.docs).toHaveLength(1);

      const queryByIDRes = await fetch(`${url}/api/custom-id/${customID}`, {
        headers,
      });
      const queryByIDData = await queryByIDRes.json();
      expect(queryByIDData.id).toStrictEqual(customID);
    });

    it('should allow querying by a field within a group', async () => {
      const text = 'laiwjefliajwe';

      await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: 'super great title',
          description: 'desc',
          priority: 1,
          nonLocalizedGroup: {
            text,
          },
          localizedGroup: {
            text,
          },
        }),
        headers,
        method: 'post',
      });

      const queryRes1 = await fetch(
        `${url}/api/localized-posts?where[nonLocalizedGroup.text][equals]=${text}`,
      );
      const data1 = await queryRes1.json();

      expect(data1.docs).toHaveLength(1);

      const queryRes2 = await fetch(
        `${url}/api/localized-posts?where[localizedGroup.text][equals]=${text}`,
      );
      const data2 = await queryRes2.json();

      expect(queryRes2.status).toBe(200);
      expect(data2.docs).toHaveLength(1);
    });
  });

  describe('Delete', () => {
    it('should allow a post to be deleted', async () => {
      const response = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: 'title to be deleted',
          description: englishPostDesc,
          priority: 1,
        }),
        headers,
        method: 'post',
      });

      const data = await response.json();
      const docId = data.doc.id;
      expect(response.status).toBe(201);
      expect(docId).toBeDefined();

      const deleteResponse = await fetch(`${url}/api/localized-posts/${docId}`, {
        headers,
        method: 'delete',
      });
      expect(deleteResponse.status).toBe(200);
      const deleteData = await deleteResponse.json();
      expect(deleteData.id).toBe(docId);
    });
  });

  describe('Metadata', () => {
    async function createPost(title, description) {
      await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: title || uuid(),
          description,
          priority: 1,
        }),
        headers,
        method: 'post',
      });
    }

    it('should include metadata', async () => {
      const desc = 'metadataDesc';
      for (let i = 0; i < 12; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await createPost(null, desc);
      }

      const getResponse = await fetch(
        `${url}/api/localized-posts?where[description][equals]=${desc}`,
      );
      const data = await getResponse.json();

      expect(getResponse.status).toBe(200);

      // TODO: Assert exact length once query bug is fixed
      expect(data.docs.length).toBeGreaterThan(0);
      expect(data.totalDocs).toBeGreaterThan(0);
      expect(data.limit).toBe(10);
      expect(data.page).toBe(1);
      expect(data.pagingCounter).toBe(1);
      expect(data.hasPrevPage).toBe(false);
      expect(data.hasNextPage).toBe(true);
      expect(data.prevPage).toBeNull();
      expect(data.nextPage).toBe(2);
    });

    it('should sort the results', async () => {
      const desc = 'sort';

      // Create 2 posts with different titles, same desc
      const req1 = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: 'aaa',
          description: desc,
          priority: 1,
        }),
        headers,
        method: 'post',
      });

      const req2 = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: 'zzz',
          description: desc,
          priority: 1,
        }),
        headers,
        method: 'post',
      });

      const req1data = await req1.json();
      const req2data = await req2.json();
      const id1 = req1data.doc.id;
      const id2 = req2data.doc.id;

      // Query on shared desc and sort ascending
      const getResponse = await fetch(
        `${url}/api/localized-posts?where[description][equals]=${desc}&sort=title`,
      );
      const data = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(data.docs).toHaveLength(2);
      expect(data.docs[0].id).toStrictEqual(id1);
      expect(data.docs[1].id).toStrictEqual(id2);

      // Query on shared desc and sort descending
      const getResponseSorted = await fetch(
        `${url}/api/localized-posts?where[description][equals]=${desc}&sort=-title`,
      );
      const sortedData = await getResponseSorted.json();

      expect(getResponse.status).toBe(200);
      expect(sortedData.docs).toHaveLength(2);
      // Opposite order from first request
      expect(sortedData.docs[0].id).toStrictEqual(id2);
      expect(sortedData.docs[1].id).toStrictEqual(id1);
    });
  });

  describe('Field Access', () => {
    it('should properly prevent / allow public users from reading a restricted field', async () => {
      const firstArrayText1 = 'test 1';
      const firstArrayText2 = 'test 2';

      const response = await fetch(`${url}/api/localized-arrays`, {
        body: JSON.stringify({
          array: [
            {
              arrayText1: firstArrayText1,
              arrayText2: 'test 2',
              arrayText3: 'test 3',
              allowPublicReadability: true,
            },
            {
              arrayText1: firstArrayText2,
              arrayText2: 'test 2',
              arrayText3: 'test 3',
              allowPublicReadability: false,
            },
          ],
        }),
        headers,
        method: 'post',
      });

      const data = await response.json();
      const docId = data.doc.id;
      expect(response.status).toBe(201);
      expect(data.doc.array[1].arrayText1).toStrictEqual(firstArrayText2);

      const unauthenticatedResponse = await fetch(`${url}/api/localized-arrays/${docId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(unauthenticatedResponse.status).toBe(200);
      const unauthenticatedData = await unauthenticatedResponse.json();

      // This string should be allowed to come back
      expect(unauthenticatedData.array[0].arrayText1).toBe(firstArrayText1);

      // This string should be prevented from coming back
      expect(unauthenticatedData.array[1].arrayText1).toBeUndefined();

      const authenticatedResponse = await fetch(`${url}/api/localized-arrays/${docId}`, {
        headers,
      });

      const authenticatedData = await authenticatedResponse.json();

      // If logged in, we should get this field back
      expect(authenticatedData.array[1].arrayText1).toStrictEqual(firstArrayText2);
    });
  });

  describe('Unique', () => {
    it('should prevent unique fields from duplicating data', async () => {
      const nonUniqueTitle = 'title';

      const response = await fetch(`${url}/api/uniques`, {
        body: JSON.stringify({
          title: nonUniqueTitle,
        }),
        headers,
        method: 'post',
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.doc.title).toStrictEqual(nonUniqueTitle);

      const failedResponse = await fetch(`${url}/api/uniques`, {
        body: JSON.stringify({
          title: nonUniqueTitle,
        }),
        headers,
        method: 'post',
      });

      expect(failedResponse.status).toStrictEqual(500);
    });
  });

  describe('Custom ID', () => {
    const document = {
      id: 1,
      name: 'name',
    };
    let data;
    beforeAll(async (done) => {
      // create document
      const create = await fetch(`${url}/api/custom-id`, {
        body: JSON.stringify(document),
        headers,
        method: 'post',
      });
      data = await create.json();
      done();
    });

    it('should create collections with custom ID', async () => {
      expect(data.doc.id).toBe(document.id);
    });

    it('should read collections by custom ID', async () => {
      const response = await fetch(`${url}/api/custom-id/${document.id}`, {
        headers,
        method: 'get',
      });

      const result = await response.json();

      expect(result.id).toStrictEqual(document.id);
      expect(result.name).toStrictEqual(document.name);
    });

    it('should update collection by custom ID', async () => {
      const updatedDoc = { id: 'cannot-update-id', name: 'updated' };
      const response = await fetch(`${url}/api/custom-id/${document.id}`, {
        headers,
        body: JSON.stringify(updatedDoc),
        method: 'put',
      });

      const result = await response.json();

      expect(result.doc.id).not.toStrictEqual(updatedDoc.id);
      expect(result.doc.name).not.toStrictEqual(document.name);
      expect(result.doc.name).toStrictEqual(updatedDoc.name);
    });

    it('should delete collection by custom ID', async () => {
      const doc = {
        id: 2,
        name: 'delete me',
      };
      const createResponse = await fetch(`${url}/api/custom-id`, {
        body: JSON.stringify(doc),
        headers,
        method: 'post',
      });
      const result = await createResponse.json();
      const response = await fetch(`${url}/api/custom-id/${result.doc.id}`, {
        headers,
        method: 'delete',
      });

      expect(response.status).toBe(200);
      const deleteData = await response.json();
      expect(deleteData.id).toBe(doc.id);
    });

    it('should allow querying by custom ID', async () => {
      const response = await fetch(`${url}/api/custom-id?where[id][equals]=${document.id}`, {
        headers,
        method: 'get',
      });
      const emptyResponse = await fetch(`${url}/api/custom-id?where[id][equals]=900`, {
        headers,
        method: 'get',
      });

      const result = await response.json();
      const emptyResult = await emptyResponse.json();

      expect(result.docs).toHaveLength(1);
      expect(emptyResult.docs).toHaveLength(0);
    });
  });
});
