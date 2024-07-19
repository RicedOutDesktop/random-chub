import { extension_settings } from "../../../extensions.js";
import {
  saveSettingsDebounced,
  processDroppedFiles,
  getRequestHeaders,
} from "../../../../script.js";

const extensionName = "random-chub";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {
  min_user_chats: 0,
  min_token_count: 600,
  max_token_count: 3000,
  tags: "",
  exclude_tags: "",
  nsfw: true,
  nsfw_only: false,
  nsfl: true,
};

async function loadSettings() {
  //Create the settings if they don't exist
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  }

  // Updating settings in the UI
  $("#min_user_chats_value")
    .prop("value", extension_settings[extensionName].min_user_chats)
    .trigger("input");
  $("#min_user_chats_slider")
    .prop("value", extension_settings[extensionName].min_user_chats)
    .trigger("input");
  $("#min_token_count_value")
    .prop("value", extension_settings[extensionName].min_token_count)
    .trigger("input");
  $("#min_token_count_slider")
    .prop("value", extension_settings[extensionName].min_token_count)
    .trigger("input");
  $("#max_token_count_value")
    .prop("value", extension_settings[extensionName].max_token_count)
    .trigger("input");
  $("#max_token_count_slider")
    .prop("value", extension_settings[extensionName].max_token_count)
    .trigger("input");
  $("#tags").prop("value", extension_settings[extensionName].tags).trigger("input");
  $("#exclude_tags")
    .prop("value", extension_settings[extensionName].exclude_tags)
    .trigger("input");
  $("#nsfw").prop("checked", extension_settings[extensionName].nsfw).trigger("input");
  $("#nsfw_only").prop("checked", extension_settings[extensionName].nsfw_only).trigger("input");
  $("#nsfl").prop("checked", extension_settings[extensionName].nsfl).trigger("input");
}

function onNSFWInput(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].nsfw = value;
  saveSettingsDebounced();
}

function onNSFWOnlyInput(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].nsfw_only = value;
  saveSettingsDebounced();
}

function onNSFLInput(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].nsfl = value;
  saveSettingsDebounced();
}

function onChangeMinUserSlider(event) {
  const value = $(event.target).prop("value");
  $("#min_user_chats_value").prop("value", value).trigger("input");
  extension_settings[extensionName].min_user_chats = value;
  saveSettingsDebounced();
}

function onChangeMinUserValue(event) {
  const value = $(event.target).prop("value");
  $("#min_user_chats_slider").prop("value", value).trigger("input");
  extension_settings[extensionName].min_user_chats = value;
  saveSettingsDebounced();
}

function onChangeMinTokenValue(event) {
  const value = $(event.target).prop("value");
  $("#min_token_count_slider").prop("value", value).trigger("input");
  extension_settings[extensionName].min_token_count = value;
  saveSettingsDebounced();
}

function onChangeMinTokenSlider(event) {
  const value = $(event.target).prop("value");
  $("#min_token_count_value").prop("value", value).trigger("input");
  extension_settings[extensionName].min_token_count = value;
  saveSettingsDebounced();
}

function onChangeMaxTokenValue(event) {
  const value = $(event.target).prop("value");
  $("#max_token_count_slider").prop("value", value).trigger("input");
  extension_settings[extensionName].max_token_count = value;
  saveSettingsDebounced();
}

function onChangeMaxTokenSlider(event) {
  const value = $(event.target).prop("value");
  $("#max_token_count_value").prop("value", value).trigger("input");
  extension_settings[extensionName].max_token_count = value;
  saveSettingsDebounced();
}

function onChangeTags(event) {
  const value = $(event.target).prop("value");
  extension_settings[extensionName].tags = value;
  saveSettingsDebounced();
}

function onChangeExcludeTags(event) {
  const value = $(event.target).prop("value");
  extension_settings[extensionName].exclude_tags = value;
  saveSettingsDebounced();
}

function onDlClick() {
  // prepare url
  let url = `https://api.chub.ai/search?first=1&sort=random&min_users_chatted=${extension_settings[extensionName].min_user_chats}&min_tokens=${extension_settings[extensionName].min_token_count}&max_tokens=${extension_settings[extensionName].max_token_count}&page=1&namespace=characters&nsfw=${extension_settings[extensionName].nsfw}&nsfw_only=${extension_settings[extensionName].nsfw_only}&nsfl=${extension_settings[extensionName].nsfl}&tags=${extension_settings[extensionName].tags}&exclude_tags=${extension_settings[extensionName].exclude_tags}`;

  // get chubby response and send character card to the tavern
  fetch(url, { cache: "no-store" })
    .then(function (response) {
      return response.json();
    })
    .then(async function (data) {
      let fullpath = data["data"]["nodes"][0]["fullPath"];
      let cardURL = `https://chub.ai/characters/${fullpath}`;

      let request = null;
      request = await fetch("/api/content/importURL", {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({ url: cardURL }),
      });

      if (!request.ok) {
        toastr.info(
          "Click to go to the character page",
          "Custom content import failed",
          { onclick: () => window.open(cardURL, "_blank") }
        );
        console.error(
          "Custom content import failed",
          request.status,
          request.statusText
        );
        return;
      }

      let rData = await request.blob();
      let customContentType = request.headers.get("X-Custom-Content-Type");
      let fileName = request.headers
        .get("Content-Disposition")
        .split("filename=")[1]
        .replace(/"/g, "");
      let file = new File([rData], fileName, { type: rData.type });
      switch (customContentType) {
        case "character":
          processDroppedFiles([file]);
          break;
        default:
          toastr.warning("Unknown content type");
          console.error("Unknown content type", customContentType);
          break;
      }
    })
    .catch(function (err) {
      console.error(err);
    });
}

jQuery(async () => {
  const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);

  $("#extensions_settings").append(settingsHtml);

  $("#min_user_chats_value").on("change", onChangeMinUserValue);
  $("#min_user_chats_slider").on("change", onChangeMinUserSlider);
  $("#min_token_count_value").on("change", onChangeMinTokenValue);
  $("#min_token_count_slider").on("change", onChangeMinTokenSlider);
  $("#max_token_count_value").on("change", onChangeMaxTokenValue);
  $("#max_token_count_slider").on("change", onChangeMaxTokenSlider);

  $("#tags").on("change", onChangeTags);
  $("#exclude_tags").on("change", onChangeExcludeTags);

  $("#nsfw").on("click", onNSFWInput);
  $("#nsfw_only").on("click", onNSFWOnlyInput);
  $("#nsfl").on("click", onNSFLInput);

  $("#dl_and_import").on("click", onDlClick);

  loadSettings();
});
