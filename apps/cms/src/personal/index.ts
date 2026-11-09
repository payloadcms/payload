/**
 * Content of the personal website (atorpos/personalwebsite): everything under "Personal website"
 * in the admin panel, together with Posts (src/collections/Posts.ts) and the pages in Pages that
 * belong to the "Personal website" site. The website reads it anonymously from the REST API
 * (README: "Personal website").
 *
 * Projects, photos and photo albums have drafts: only published ones are public. The page globals
 * don't (with MongoDB, every global with drafts gets an index of the same name in the shared
 * `globals` collection, so all but one fail to build): saving a page puts it live, and its Versions
 * tab can restore an earlier one.
 */
import { PersonalPhotoAlbums } from './collections/PersonalPhotoAlbums'
import { PersonalPhotos } from './collections/PersonalPhotos'
import { PersonalProjects } from './collections/PersonalProjects'
import { PersonalAbout } from './globals/PersonalAbout'
import { PersonalBlogPage } from './globals/PersonalBlogPage'
import { PersonalContact } from './globals/PersonalContact'
import { PersonalHome } from './globals/PersonalHome'
import { PersonalPhotosPage } from './globals/PersonalPhotosPage'
import { PersonalProjectsPage } from './globals/PersonalProjectsPage'
import { PersonalServices } from './globals/PersonalServices'
import { PersonalSettings } from './globals/PersonalSettings'

export const personalCollections = [PersonalProjects, PersonalPhotos, PersonalPhotoAlbums]

export const personalGlobals = [
  PersonalSettings,
  PersonalHome,
  PersonalAbout,
  PersonalServices,
  PersonalProjectsPage,
  PersonalPhotosPage,
  PersonalBlogPage,
  PersonalContact,
]
