![image](images/title.png)

<img alt="Showcse" src="https://github.com/user-attachments/assets/3e3d45fd-b24a-4c44-8bdf-cdf45fbfdaa8" />


Simple Anki Sync for Obsidian delivers the most straightforward way to keep your flashcards in sync without ever breaking your flow. By using a single, minimal Markdown-table format and supporting only Basic cards, you’ll spend zero time tweaking settings and 100 % of your time learning.

With a single command, you can instantly push your notes to AnkiConnect—no background daemons, no surprises.
Just run a command to sync the entire vault or your current file, and watch your flashcards update in seconds. Study smarter, stay focused, and let the plugin handle the rest.

___

> **⚠️ Prerequisite**: Anki must be running with the AnkiConnect extension installed and active.
> 
> - Install from [AnkiWeb](https://ankiweb.net/shared/info/2055492159)
> - More details: [AnkiConnect homepage](https://git.sr.ht/~foosoft/anki-connect)
>



___
![image](images/installation.png)

## Automatic installation via the Obsidian App (Recomendet)

https://github.com/user-attachments/assets/aebca7a1-14c3-4023-b27a-eade3b551b3c


___
![image](images/features.png)


## Main Feature: Obsidian → Anki Sync

Commands:    
`Sync current file With Anki`   
`Sync entire vault With Anki`    
`Unsync current file with Anki`

Sync any minimal Markdown table from Obsidian into Anki as Basic cards. Just tag your note with the deck name and subdeck:

`#anki/MyDeck/Subdeck`

Then write your cards in this format:

```markdown
| Front |
| ----- |
| Back  |
````

You can even include line breaks and images in-editor:

```markdown
| Front with math: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$      |
| -------------------------------------------------------------- |
| Back<br><br>With newlines, and images<br>![[example_tree.png]] |
```
In Anki:  
![image](https://github.com/user-attachments/assets/220704a3-7865-4430-8d04-3bc212397c7e)


Run the **Sync Anki Cards** command, and your cards—with proper deck/subdeck handling—appear in Anki instantly.

---

## Unsync Feature

You can cleanly **unsync the currently active file from Anki** using the `Unsync current file with Anki` command.    
This removes all Anki note references from the file and deletes the corresponding notes in Anki via AnkiConnect, without affecting any other files in the vault. This makes it easy to intentionally remove a note (or an entire file) from Anki while keeping your Obsidian content intact.

---

## Quality-of-Life Features

- **Deck renaming**  
    Rename your `#anki/…` tag and on next sync all existing cards move into the new deck automatically.
- **Image support & resizing**  
    Embed images on either side using `![[image.png]]` and control their display size inline eg. `![[image.png|300]]`.
- **Excalidraw support**  
    Embed `.excalidraw` drawings seamlessly. They are automatically converted to images on sync.
- **Math auto-formatting**  
    Dollar-delimited LaTeX in Obsidian becomes nicely rendered in Anki.
- [x] Automatic deletion
    Delete a card in Obsidian and the corresponding Anki card is removed on sync. **IMPORTANT: don't delete the Anki-ID below manually**
- **Precise Backlinks**  
    Each card carries a URL back to its source note. Clicking it from Anki will open Obsidian and scroll you down directly to the flashcard's exact row!
- **Anki-Tags**  
    Each card in Anki has a assigned tag `obsidian_simple_anki_sync_created` to easely filter for this automatically created cards.






___
![image](images/example.png)

# Video Showcase :)

https://github.com/user-attachments/assets/790abb16-b7ea-43d2-995c-720ac1c9b2ed

---

## Deleting Cards

To remove a card from Anki, simply delete its table (or row) here. On next sync, the card will vanish from Anki too.

---

## Backlinks

Every card you sync will carry a URL back to this note so you can jump right back to your source.

---

*Happy studying!*  

