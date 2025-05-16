# Simple Anki Sync - Obsidian Plugin
> **⚠️ Prerequisite**: Anki must be running with the AnkiConnect extension installed and active.
> 
> - Install from [AnkiWeb](https://ankiweb.net/shared/info/2055492159)
> - More details: [AnkiConnect homepage](https://git.sr.ht/~foosoft/anki-connect)
>


![image](images/title.png)


Simple Anki Sync for Obsidian delivers the most straightforward way to keep your flashcards in sync without ever breaking your flow. By using a single, minimal Markdown-table format and supporting only Basic cards, you’ll spend zero time tweaking settings and 100 % of your time learning.

With a single command, you can instantly push your notes to AnkiConnect—no background daemons, no surprises.
Just run a command to sync the entire vault or your current file, and watch your flashcards update in seconds. Study smarter, stay focused, and let the plugin handle the rest.




___
![image](images/installation.png)



1.  **Open Terminal in Obsidian Plugins Folder:**
    *   Navigate to your Obsidian vault's plugin folder in your terminal or command prompt. This is usually located at:
        `<YourVault>/.obsidian/plugins/`
    *   For example:
        ```bash
        cd path/to/your/vault/.obsidian/plugins/
        ```

2.  **Clone the Repository:**
    *   Clone this repository directly into the `plugins` folder:
        ```bash
        git clone https://github.com/lukmay/simple-anki-sync.git
        ```

3.  **Navigate into Plugin Folder & Build:**
    *   Change directory into the newly cloned plugin folder:
        ```bash
        cd simple-anki-sync
        ```
    *   Run the following commands to install dependencies and build the plugin:
        ```bash
        npm install
        ```
        Then:
        ```bash
        npm run build
        ```
        This will create the necessary `main.js` file within the `simple-anki-sync` folder.

4.  **Enable in Obsidian:**
    *   **Ensure Anki is running.** (And the AnkiConnect add-on is installed and configured in Anki).
    *   Restart Obsidian or reload its plugins (e.g., by toggling "Community Plugins" off and on).
    *   Go to `Settings > Community plugins` in Obsidian.
    *   Find "Simple Anki Sync" in the list and toggle it on.



___
![image](images/features.png)


## Main Feature: Obsidian → Anki Sync

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

## Quality-of-Life Features

- **Deck renaming**  
    Rename your `#anki/…` tag and on next sync all existing cards move into the new deck automatically.
- **Image support & resizing**  
    Embed images on either side using `![[image.png]]` and control their display size inline eg. `![[image.png|300]]`.
- **Math auto-formatting**  
    Dollar-delimited LaTeX in Obsidian becomes nicely rendered in Anki.
- **Automatic deletion**  
    Delete a card in Obsidian and the corresponding Anki card is removed on sync. **IMPORTANT: don't delete the Anki-ID below manually**
- **Backlinks**  
    Each card carries a URL back to its source note for easy context retrieval.
- **Anki-Tags**  
    Each card in Anki has a assigned tag `obsidian_simple_anki_sync_created` to easely filter for this automatically created cards.






___
![image](images/example.png)

# Quantum Mechanics Cheat Sheet

---

<!-- Define your deck and optional subdeck here: -->
#anki/Physics/Quantum <-- never forget to set a deck!

Welcome to your quantum mechanics flashcards. Write each card as a minimal Markdown table, then run **Sync Anki Cards**.

---

## Card Examples

### 1. Basic definition

| What is the Heisenberg uncertainty principle? |
| ---------------------------------------------- |
| It states that you cannot simultaneously know the exact position and momentum of a particle. |

### 2. Math formatting

| Solve for $x$ in the quadratic formula: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ |
| ---------------------------------------------------------------------------------- |
| Use the plus/minus to get both roots: $x_1 = \frac{-b + \sqrt{b^2 - 4ac}}{2a},\; x_2 = \frac{-b - \sqrt{b^2 - 4ac}}{2a}$ |

### 3. Line breaks & images

| What does a particle-in-a-box wavefunction look like?<br><br>Label the nodal points. |
| -------------------------------------------------------------------------------------- |
| See diagram:<br><br>![[particle_box.png]]<br><br>The \(n\)th state has \(n-1\) nodes. |

Note you can set the size of images as following:   
![[particle_box.png]] <-- default   
![[particle_box.png|200]] <-- resized

---

## Deleting Cards

To remove a card from Anki, simply delete its table (or row) here. On next sync, the card will vanish from Anki too.

---

## Backlinks

Every card you sync will carry a URL back to this note so you can jump right back to your source.

---

*Happy studying!*  

