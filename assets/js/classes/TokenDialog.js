import Dialog from "./Dialog.js";
import TokenStore from "./TokenStore.js";
import Template from "./Template.js";
import CharacterToken from "./CharacterToken.js";
import {
    getIndex,
    lookupOne,
    lookupOneCached,
    replaceContentsMany
} from "../utils/elements.js";

/**
 * A version of {@link Dialog} that shows one or more tokens, probably to the
 * player.
 */
export default class TokenDialog extends Dialog {

    /**
     * Gets a cached instance of {@link TokenDialog}, allowing it to act like a
     * singleton.
     *
     * @return {TokenDialog}
     *         An instance.
     */
    static get() {
        return this.create(lookupOneCached("#token"));
    }

    /**
     * @inheritdoc
     */
    constructor(dialog) {

        super(dialog);

        /**
         * The token store that keeps information about the tokens.
         * @type {TokenStore}
         */
        this.tokenStore = null;

        /**
         * The template for one token.
         * @type {Template}
         */
        this.entryTemplate = null;

        this.setIds([]);
        this.discoverElements();

    }

    /**
     * @inheritdoc
     */
    addListeners() {

        super.addListeners();

        const {
            constructor: {
                SHOW,
                HIDE
            },
            dialog
        } = this;

        this.on(SHOW, () => this.drawCharacters());
        this.on(HIDE, () => this.setMultipleTitle(""));

        dialog.addEventListener("click", ({ target }) => {

            const removeButton = target.closest(".js--token--remove");
            const removeItem = removeButton?.closest(".js--token--item");

            if (removeItem) {

                this.removeIdByIndex(getIndex(removeItem));
                this.drawCharacters();

            }

        });

    }

    /**
     * Discovered elements, storing them on the instance so they can be
     * referenced by other methods without having to be found again.
     */
    discoverElements() {

        const {
            dialog
        } = this;

        /**
         * The element that contains the title text.
         * @type {Element}
         */
        this.title = lookupOne(".js--token--title", dialog);

        /**
         * The element that contains all the token renderings.
         * @type {Element}
         */
        this.holder = lookupOne(".js--token--holder", dialog);

    }

    /**
     * Adds a token ID to {@link TokenDialog#ids}. The ID does not need to be
     * unique.
     *
     * @param {String} id
     *        ID to add.
     */
    addId(id) {
        this.ids.push(id);
    }

    /**
     * Removes all IDs from {@link TokenDialog#ids} that match the given ID.
     *
     * @param {String}
     *        ID to remove.
     */
    removeId(id) {
        this.ids = this.ids.filter((existingId) => existingId !== id);
    }

    /**
     * Removes the ID from {@link TokenDialog#ids} that's at the given index.
     *
     * @param {Number} index
     *        Index that should be removed from the IDs. If the index is less
     *        than 0, no action is taken.
     */
    removeIdByIndex(index) {

        if (index < 0) {
            return;
        }

        this.ids.splice(index, 1);

    }

    /**
     * Sets {@link TokenDialog#ids}.
     *
     * @param {Array.<String>} ids
     *        IDs to set. This may be an empty array.
     */
    setIds(ids) {

        /**
         * A list of all the token IDs that will be displayed when the dialog
         * shows.
         * @type {Array.<String>}
         */
        this.ids = ids;

    }

    /**
     * Gets a copy of {@link TokenDialog#ids}. Modifying the copy does not
     * affect the original.
     *
     * @return {Array.<String>}
     *         Copy of the IDs.
     */
    getIds() {
        return [...this.ids];
    }

    /**
     * Sets the text displayed in {@link TokenDialog#title}.
     *
     * @param {String} title
     *        Text to display.
     */
    setTitle(title) {
        this.title.textContent = title;
    }

    /**
     * Sets {@link TokenDialog#tokenStore}.
     *
     * @param {TokenStore} tokenStore
     *        The token store.
     */
    setTokenStore(tokenStore) {
        this.tokenStore = tokenStore;
    }

    /**
     * Sets {@link TokenDialog#entryTemplate}.
     *
     * @param {Template} entryTemplate
     *        The template.
     */
    setEntryTemplate(entryTemplate) {
        this.entryTemplate = entryTemplate;
    }

    /**
     * Gets a {@link CharacterToken} for each ID in {@link TokenDialog#ids}.
     *
     * @return {Array.<CharacterToken>}
     *         Characters that this dialog should show.
     */
    getCharacters() {

        const {
            tokenStore
        } = this;

        if (!tokenStore) {
            throw new Error("tokenStore has not been set");
        }

        return this.ids.map((id) => tokenStore.getCharacter(id));

    }

    /**
     * Gets the title text to display when there is more than one character
     * being displayed.
     *
     * @return {String}
     *         The title for multiple characters.
     */
    getMultipleTitle() {
        return this.multipleTitle || this.title.dataset.multiple;
    }

    /**
     * Sets {@link TokenDialog#multipleTitle}.
     *
     * @param {String} multipleTitle
     *        The text to display when there are multiple characters to show.
     */
    setMultipleTitle(multipleTitle) {

        /**
         * The text to show when there are multiple characters being displayed.
         * @type {String}
         */
        this.multipleTitle = multipleTitle;

    }

    /**
     * Displays all the characters in the dialog.
     *
     * @throws {Error}
     *         {@link TokenDialog#entryTemplate} must be set.
     */
    drawCharacters() {

        const {
            holder,
            entryTemplate
        } = this;

        if (!entryTemplate) {
            throw new Error("entryTemplate has not been set");
        }

        const characters = this.getCharacters();
        const isMultiple = characters.length > 1;

        replaceContentsMany(
            holder,
            characters.map((character) => entryTemplate.draw({
                ".js--token--show"(element) {
                    element.append(character.drawToken());
                },
                ".js--token--ability"(element) {
                    element.textContent = character.getAbility();
                    element.hidden = isMultiple;
                }
            }))
        );

        this.setTitle(
            isMultiple
            ? this.getMultipleTitle()
            : (characters[0]?.getName() || "")
        );
        holder.classList.toggle("is-multiple", isMultiple);

    }

}
