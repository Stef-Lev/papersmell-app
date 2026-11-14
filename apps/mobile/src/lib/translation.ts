import englishMessages from "../../../../src/messages/en.json";
import greekMessages from "../../../../src/messages/el.json";
import type { Locale } from "../providers/preferences-provider";

function collectTranslations(
  english: unknown,
  greek: unknown,
  translations: Map<string, string>,
) {
  if (typeof english === "string" && typeof greek === "string") {
    translations.set(english, greek);
    return;
  }
  if (
    !english ||
    !greek ||
    typeof english !== "object" ||
    typeof greek !== "object"
  ) {
    return;
  }
  for (const key of Object.keys(english)) {
    collectTranslations(
      (english as Record<string, unknown>)[key],
      (greek as Record<string, unknown>)[key],
      translations,
    );
  }
}

const translations = new Map<string, string>();
collectTranslations(englishMessages, greekMessages, translations);

const mobileGreekOverrides: Record<string, string> = {
  "Loading your books…": "Φόρτωση των βιβλίων σου…",
  "No options available yet.": "Δεν υπάρχουν ακόμη διαθέσιμες επιλογές.",
  "A snapshot of your reading year.": "Μια εικόνα της αναγνωστικής σου χρονιάς.",
  "No books match these filters": "Κανένα βιβλίο δεν ταιριάζει με αυτά τα φίλτρα",
  "Try a different shelf or search term.": "Δοκίμασε άλλο ράφι ή όρο αναζήτησης.",
  "Search the catalog and add a book to get started.": "Αναζήτησε στον κατάλογο και πρόσθεσε ένα βιβλίο για να ξεκινήσεις.",
  Preferences: "Προτιμήσεις",
  Language: "Γλώσσα",
  Appearance: "Εμφάνιση",
  English: "Αγγλικά",
  Greek: "Ελληνικά",
  System: "Σύστημα",
  Light: "Ανοιχτό",
  Dark: "Σκούρο",
  "Could not save your language preference.": "Δεν ήταν δυνατή η αποθήκευση της γλώσσας.",
  "Could not save your appearance preference.": "Δεν ήταν δυνατή η αποθήκευση της εμφάνισης.",
  "YOUR READING COMPANION": "Ο ΣΥΝΤΡΟΦΟΣ ΣΟΥ ΣΤΗΝ ΑΝΑΓΝΩΣΗ",
  "A SHELF OF YOUR OWN": "ΤΟ ΔΙΚΟ ΣΟΥ ΡΑΦΙ",
  "Welcome back.": "Καλώς ήρθες ξανά.",
  "Sign in to pick up where you left off.": "Συνδέσου για να συνεχίσεις από εκεί που έμεινες.",
  "Create your account.": "Δημιούργησε τον λογαριασμό σου.",
  "Keep your reading life in one place.": "Όλη η αναγνωστική σου πορεία σε ένα μέρος.",
  "Reset your password": "Επαναφορά κωδικού πρόσβασης",
  "Choose a new password": "Επίλεξε νέο κωδικό πρόσβασης",
  "Back to sign in": "Επιστροφή στη σύνδεση",
  "I have a reset token": "Έχω κωδικό επαναφοράς",
  "New to PaperSmell? Create an account": "Νέος/α στο PaperSmell; Δημιούργησε λογαριασμό",
  "Already have an account? Sign in": "Έχεις ήδη λογαριασμό; Συνδέσου",
  "Password (at least 8 characters)": "Κωδικός πρόσβασης (τουλάχιστον 8 χαρακτήρες)",
  "Reset token": "Κωδικός επαναφοράς",
  "Send reset link": "Αποστολή συνδέσμου επαναφοράς",
  "Go to sign in": "Μετάβαση στη σύνδεση",
  "Collections": "Συλλογές",
  "Group books into lists that make sense to you.": "Οργάνωσε τα βιβλία σου σε λίστες όπως σε εξυπηρετεί.",
  "New collection": "Νέα συλλογή",
  "Create collection": "Δημιουργία συλλογής",
  "Collection name": "Όνομα συλλογής",
  "You have not created any collections yet.": "Δεν έχεις δημιουργήσει ακόμη συλλογές.",
  "Reading calendar": "Ημερολόγιο ανάγνωσης",
  "See the days your books were in progress.": "Δες τις ημέρες που διάβαζες τα βιβλία σου.",
  "Previous month": "Προηγούμενος μήνας",
  "Next month": "Επόμενος μήνας",
  "A quiet reading day": "Μια ήσυχη μέρα ανάγνωσης",
  "Books with recorded start and finish dates appear here.": "Εδώ εμφανίζονται βιβλία με καταγεγραμμένες ημερομηνίες έναρξης και ολοκλήρωσης.",
  "book": "βιβλίο",
  "books": "βιβλία",
  "page": "σελίδα",
  "pages": "σελίδες",
  "in progress": "σε εξέλιξη",
  "My library": "Η βιβλιοθήκη μου",
  "Manage collections": "Διαχείριση συλλογών",
  "Search your library": "Αναζήτηση στη βιβλιοθήκη",
  "Title, author, or ISBN": "Τίτλος, συγγραφέας ή ISBN",
  Author: "Συγγραφέας",
  Category: "Κατηγορία",
  Collection: "Συλλογή",
  "Sort by": "Ταξινόμηση",
  "Page count": "Αριθμός σελίδων",
  "Date added": "Ημερομηνία προσθήκης",
  "Find your next read": "Βρες το επόμενο βιβλίο σου",
  "Search the catalog or add a book that isn't listed.": "Αναζήτησε στον κατάλογο ή πρόσθεσε ένα βιβλίο που λείπει.",
  "Try a title or ISBN": "Δοκίμασε τίτλο ή ISBN",
  "Search books": "Αναζήτηση βιβλίων",
  "Scan ISBN": "Σάρωση ISBN",
  "Add to shelf": "Προσθήκη σε ράφι",
  "Add to collection": "Προσθήκη σε συλλογή",
  "Search results": "Αποτελέσματα αναζήτησης",
  "Search by title, author, or ISBN to see catalog results.": "Αναζήτησε με τίτλο, συγγραφέα ή ISBN για να δεις αποτελέσματα.",
  "Can’t find it?": "Δεν το βρίσκεις;",
  "Add the book details yourself.": "Πρόσθεσε τα στοιχεία του βιβλίου χειροκίνητα.",
  "Add a book manually": "Χειροκίνητη προσθήκη βιβλίου",
  "Separate multiple authors with commas": "Χώρισε τους συγγραφείς με κόμμα",
  "Separate categories with commas": "Χώρισε τις κατηγορίες με κόμμα",
  "Cover image URL (optional)": "URL εικόνας εξωφύλλου (προαιρετικό)",
  "Save book": "Αποθήκευση βιβλίου",
  "A good book is out there": "Κάπου υπάρχει ένα καλό βιβλίο",
  "Your library is waiting": "Η βιβλιοθήκη σου σε περιμένει",
  "A little space for the books you love.": "Ένας μικρός χώρος για τα βιβλία που αγαπάς.",
  "In your library": "Στη βιβλιοθήκη σου",
  "Marked read": "Ολοκληρωμένα",
  "Your shelves": "Τα ράφια σου",
  "A snapshot of your library": "Μια ματιά στη βιβλιοθήκη σου",
  "Open my library": "Άνοιγμα βιβλιοθήκης",
  "Currently reading": "Σε ανάγνωση",
  "Pick up where you left off": "Συνέχισε από εκεί που σταμάτησες",
  "Nothing on your reading desk yet": "Δεν έχεις βιβλία στο αναγνωστικό σου γραφείο",
  "Choose a book from your library or discover something new.": "Διάλεξε ένα βιβλίο από τη βιβλιοθήκη σου ή ανακάλυψε κάτι νέο.",
  "Find a book": "Βρες ένα βιβλίο",
  "Your profile": "Το προφίλ σου",
  "Manage your account and preferences.": "Διαχειρίσου τον λογαριασμό και τις προτιμήσεις σου.",
  "Choose profile photo": "Επιλογή φωτογραφίας προφίλ",
  "Remove photo": "Αφαίρεση φωτογραφίας",
  "Account details": "Στοιχεία λογαριασμού",
  "Change password": "Αλλαγή κωδικού πρόσβασης",
  "Your library": "Η βιβλιοθήκη σου",
  "Reading insights": "Στατιστικά ανάγνωσης",
  "Year": "Έτος",
  "Open reading calendar": "Άνοιγμα ημερολογίου ανάγνωσης",
  "Pages in finished books": "Σελίδες σε ολοκληρωμένα βιβλία",
  "Books finished": "Ολοκληρωμένα βιβλία",
  "Books finished by year": "Ολοκληρωμένα βιβλία ανά έτος",
  "Books finished by month": "Ολοκληρωμένα βιβλία ανά μήνα",
  "All time": "Συνολικά",
  "Selected collection": "Επιλεγμένη συλλογή",
  "Finished in": "Ολοκληρώθηκαν το",
  "Completion counts use the finish dates recorded on your books.": "Οι ολοκληρώσεις υπολογίζονται με βάση τις ημερομηνίες που έχουν καταχωριστεί στα βιβλία σου.",
  "Average rating": "Μέση βαθμολογία",
  "out of 5": "στα 5",
  "Library read": "Ποσοστό ολοκλήρωσης βιβλιοθήκης",
  "Shelf overview": "Επισκόπηση ραφιών",
  "Your highest rated": "Τα βιβλία με την υψηλότερη βαθμολογία",
  "No ratings yet": "Δεν υπάρχουν ακόμη βαθμολογίες",
  "Rate a finished book to see it here.": "Βαθμολόγησε ένα ολοκληρωμένο βιβλίο για να εμφανιστεί εδώ.",
  "Book details": "Στοιχεία βιβλίου",
  "Back to library": "Επιστροφή στη βιβλιοθήκη",
  "Book information": "Πληροφορίες βιβλίου",
  "Save book information": "Αποθήκευση πληροφοριών βιβλίου",
  "Edit book information": "Επεξεργασία πληροφοριών βιβλίου",
  "Mark as read": "Σήμανση ως ολοκληρωμένου",
  "Started (YYYY-MM-DD)": "Έναρξη (ΕΕΕΕ-MM-ΗΗ)",
  "Finished (YYYY-MM-DD)": "Ολοκλήρωση (ΕΕΕΕ-MM-ΗΗ)",
  "Review or notes": "Κριτική ή σημειώσεις",
  "What did you think?": "Πώς σου φάνηκε;",
  "Save changes": "Αποθήκευση αλλαγών",
  "Remove from library": "Αφαίρεση από τη βιβλιοθήκη",
  "Your rating": "Η βαθμολογία σου",
  "Not rated": "Χωρίς βαθμολογία",
  "Decrease rating by half a star": "Μείωση βαθμολογίας κατά μισό αστέρι",
  "Increase rating by half a star": "Αύξηση βαθμολογίας κατά μισό αστέρι",
  "Set rating to one star": "Ορισμός βαθμολογίας σε ένα αστέρι",
  "Unknown author": "Άγνωστος συγγραφέας",
  "To Read": "Για ανάγνωση",
  "Currently Reading": "Σε ανάγνωση",
  Read: "Ολοκληρωμένα",
  "Did Not Finish": "Δεν ολοκληρώθηκε",
  "All books": "Όλα τα βιβλία",
  Any: "Οποιοδήποτε",
  Clear: "Καθαρισμός",
  Done: "Έτοιμο",
  Cancel: "Ακύρωση",
  Close: "Κλείσιμο",
  "Sign out": "Αποσύνδεση",
  Discover: "Ανακάλυψη",
  Insights: "Στατιστικά",
  Profile: "Προφίλ",
  "Discover books": "Ανακάλυψη βιβλίων",
  "Profile and preferences": "Προφίλ και προτιμήσεις",
  "Scan a book barcode": "Σάρωση γραμμωτού κώδικα βιβλίου",
  "Camera access is needed to scan an ISBN barcode.": "Απαιτείται πρόσβαση στην κάμερα για τη σάρωση του ISBN.",
  "Allow camera access": "Να επιτρέπεται η πρόσβαση στην κάμερα",
  "Camera access unavailable": "Η πρόσβαση στην κάμερα δεν είναι διαθέσιμη",
  "Point the camera at the 13-digit ISBN barcode on the book.": "Στρέψε την κάμερα στον 13ψήφιο γραμμωτό κώδικα ISBN του βιβλίου.",
};

export function translateText(value: string, locale: Locale) {
  if (locale === "en") return value;
  const greeting = /^Hello, (.+)\.$/.exec(value);
  if (greeting) return `Γεια σου, ${greeting[1]}.`;
  const shelfCount = /^(\d+) books on your shelves$/.exec(value);
  if (shelfCount) return `${shelfCount[1]} βιβλία στα ράφια σου`;
  const pageProgress = /^Page (\d+) of (\d+)$/.exec(value);
  if (pageProgress) return `Σελίδα ${pageProgress[1]} από ${pageProgress[2]}`;
  const pageNumber = /^Page (\d+)$/.exec(value);
  if (pageNumber) return `Σελίδα ${pageNumber[1]}`;
  const progress = /^Reading progress: (\d+)%$/.exec(value);
  if (progress) return `Πρόοδος ανάγνωσης: ${progress[1]}%`;
  return mobileGreekOverrides[value] ?? translations.get(value) ?? value;
}
