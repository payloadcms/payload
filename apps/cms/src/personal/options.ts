/**
 * Choices of the personal website's content. The website maps each value to an icon
 * (components/SiteIcons.jsx in the website repo), so keep the values once they're in use; labels
 * can change freely. To add one, add it here and to the website's map, otherwise the website shows
 * it without an icon.
 */

/** Icons of the main menu (react-icons on the website) */
export const menuIcons = [
  { label: 'Home', value: 'home' },
  { label: 'Person', value: 'user' },
  { label: 'Briefcase', value: 'briefcase' },
  { label: 'Pencil', value: 'pencil' },
  { label: 'Trophy', value: 'trophy' },
  { label: 'Envelope', value: 'envelope' },
  { label: 'Camera', value: 'camera' },
  { label: 'Picture', value: 'picture' },
  { label: 'Book', value: 'book' },
  { label: 'Note', value: 'note' },
  { label: 'Star', value: 'star' },
  { label: 'Heart', value: 'heart' },
  { label: 'Globe', value: 'globe' },
  { label: 'Rocket', value: 'rocket' },
  { label: 'Light bulb', value: 'bulb' },
  { label: 'Chart', value: 'graph' },
  { label: 'People', value: 'people' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Screen', value: 'screen' },
  { label: 'Smartphone', value: 'smartphone' },
  { label: 'Diamond', value: 'diamond' },
]

/** Social networks of the links under the menu */
export const socialPlatforms = [
  { label: 'GitHub', value: 'github' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'X', value: 'x' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Medium', value: 'medium' },
  { label: 'Stack Overflow', value: 'stackoverflow' },
  { label: 'Dribbble', value: 'dribbble' },
  { label: 'Behance', value: 'behance' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Email', value: 'email' },
  { label: 'Website', value: 'website' },
]

/** Kinds of contact details on the Contact page; each has its own icon */
export const contactDetailTypes = [
  { label: 'Phone', value: 'phone' },
  { label: 'Email', value: 'email' },
  { label: 'Location', value: 'location' },
  ...socialPlatforms.filter(({ value }) => value !== 'email'),
  { label: 'Other', value: 'other' },
]
