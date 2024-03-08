import ar from './ar.js'
import az from './az.js'
import bg from './bg.js'
import cs from './cs.js'
import de from './de.js'
import en from './en.js'
import es from './es.js'
import fa from './fa.js'
import fr from './fr.js'
import hr from './hr.js'
import hu from './hu.js'
import it from './it.js'
import ja from './ja.js'
import ko from './ko.js'
import my from './my.js'
import nb from './nb.js'
import nl from './nl.js'
import pl from './pl.js'
import pt from './pt.js'
import ro from './ro.js'
import rs from './rs.js'
import rsLatin from './rs-latin.js'
import ru from './ru.js'
import sv from './sv.js'
import th from './th.js'
import tr from './tr.js'
import ua from './ua.js'
import vi from './vi.js'
import zh from './zh.js'
import zhTw from './zh-tw.js'

export const translations = {
  ar,
  az,
  bg,
  cs,
  de,
  en,
  es,
  fa,
  fr,
  hr,
  hu,
  it,
  ja,
  ko,
  my,
  nb,
  nl,
  pl,
  pt,
  ro,
  rs,
  'rs-latin': rsLatin,
  ru,
  sv,
  th,
  tr,
  ua,
  vi,
  zh,
  'zh-tw': zhTw,
} as {
  [locale: string]: Record<string, Record<string, string>>
}
