/* global window, getServiceDetails, RATING_TEXT */

function escapeHTML(unsafe) {
  return (`${unsafe}`)
    .replace(/&(?!amp;)/g, '&amp;')
    .replace(/<(?!lt;)/g, '&lt;')
    .replace(/>(?!gt;)/g, '&gt;')
    .replace(/"(?!quot;)/g, '&quot;')
    .replace(/'(?!#039;)/g, '&#039;');
}

/*
  Return a DocumentFragment with the DOM structure for a ToS data point
  with badge, summary and description to be appended to the list of points.
  See <template id="point-template"> for markup.

  @param {Object} dataPoint
         An object with data about a ToS point. Example structure:
         {
           id:          {String}
           title:       {String} // Summary of ToS point
           description: {String} // Description of ToS point
           discussion	  {String} // URL to discussion about ToS point
           point	      {String} // One of: "good", "bad", "blocker", "neutral"
           score	      {Number}
         }

  @returns {DocumentFragment}
*/
function renderPoint(dataPoint) {
  let badge;
  let icon;
  switch (dataPoint.point) {
    case 'good':
      badge = 'badge-success';
      icon = 'thumbs-up';
      break;
    case 'bad':
      badge = 'badge-warning';
      icon = 'thumbs-down';
      break;
    case 'blocker':
      badge = 'badge-important';
      icon = 'remove';
      break;
    case 'neutral':
      badge = 'badge-neutral';
      icon = 'asterisk';
      break;
    default:
      badge = '';
      icon = 'question-sign';
  }

  const pointText = dataPoint.description || '';
  // Extract links from text
  let taggedText = pointText.split(/(<\/?\w+(?:(?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>)/gim);

  const template = document.getElementById('point-template');
  // Create a DocumentFragment from the template element.
  const node = document.importNode(template.content, true);

  const badgeEl = node.querySelector("[js-badge]");
  const badgeIconEl = node.querySelector("[js-badge-icon]");
  const titleEl = node.querySelector("[js-title]");
  const discussionLinkEl = node.querySelector("[js-discussion-link]");
  const descriptionEl = node.querySelector("[js-description]");

  badgeEl.classList.add(badge);
  badgeEl.title = escapeHTML(dataPoint.point);
  badgeIconEl.classList.add(`glyphicon-${icon}`);
  titleEl.textContent = dataPoint.title;
  discussionLinkEl.href = escapeHTML(dataPoint.discussion);
  // Ensure taggedText is an array.
  taggedText = Array.isArray(taggedText) ? taggedText : [taggedText];
  for (text of taggedText) {
    descriptionEl.append(text);
  }

  return node;
}

/*
  Return a DocumentFragment with the content for the list of links to
  additional reading material, such as terms of service, privacy policy, etc.

  @param {Array} documents
          List of objects describing additional reading materials.
          Example structure:
          [
            {
              href: {String} // URL to document,
              name: {String} // document title
            }
          ]

  @returns {DocumentFragment}
*/
function renderDocuments(documents = []) {
  // Return an empty string when there are no documents.
  // This way, Node.append() using this method's return value won't throw.
  if (!documents.length) {
    return "";
  }

  const template = document.getElementById('documents-template');
  // Create a DocumentFragment from the template element.
  const node = document.importNode(template.content, true);
  const list = node.querySelector("[js-list]");

  for (doc of documents) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = escapeHTML(doc.url);
    link.textContent = doc.name;

    li.append(link)
    list.append(li);
  }

  return node;
}

/*
  Return a DocumentFragment with the section content for the rating
  label and rating overview for a given rating label.

  @param   {String|Boolean} rated
           Rating label may be either a string or boolean `false`.
           See keys of RATING_TEXT for rating labels.

  @returns {DocumentFragment}
*/
function renderRatingOverview(rated) {
  const template = document.getElementById('rating-template');
  const node = document.importNode(template.content, true);

  const ratingLabelEl = node.querySelector("[js-rating-label");
  const ratingTextEl = node.querySelector("[js-rating-text");

  ratingLabelEl.classList.add(rated);
  ratingLabelEl.textContent = rated ? `Class ${rated}` : 'No Class Yet';
  ratingTextEl.textContent = RATING_TEXT[rated];

  return node;
}

/*
  Return a DocumentFragment with the content for rating label and text
  for unknown services.
*/
function renderUnknownRating() {
  const template = document.getElementById('rating-unknown-template');
  const node = document.importNode(template.content, true);

  return node;
}

function render() {
  // Pluck the service URL from the current window's hash.
  // The background page invokes popup.html with the hash assigned.
  const serviceUrl = window.location.hash.substr(1);
  const serviceLink = document.querySelector('#service_url');
  const pointsList = document.querySelector('.tosdr-points');
  const documentsSection = document.querySelector('#documents');
  const ratingSection = document.querySelector('.tosdr-rating')
  const closeButton = document.querySelector('#closeButton');
  closeButton.addEventListener("click",
    (e) => { window.close() }, { once: true });

  // Set the document in the "loading" state.
  // This satisfies a CSS selector that shows the loading indicator for sighted users and announces this state for users of screen readers.
  document.body.setAttribute("aria-busy", "true");

  getServiceDetails(serviceUrl)
    .then((service) => {
      if (serviceUrl === 'none') {
        ratingSection.append(renderUnknownRating());
      } else {
        // Link to service details on tosdr.org
        serviceLink.setAttribute("href", `http://tosdr.org/#${escapeHTML(service.slug)}`)

        // Rating label and overview
        ratingSection.append(renderRatingOverview(service.rated));

        // Points
        for (const point of service.points) {
          pointsList.append(renderPoint(point));
        }

        // Documents
        documentsSection.append(renderDocuments(service.documents));
      }
    })
    .catch(err => {
      console.error(err)
    })
    .finally(() => {
      // Ensure document does not remain in the "loading" state
      // even if an error is thrown and caught by catch()
      document.body.removeAttribute("aria-busy");
    });
}

document.addEventListener("DOMContentLoaded", render);
