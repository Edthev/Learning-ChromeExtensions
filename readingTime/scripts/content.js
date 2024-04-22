const article = document.querySelector("article");
const readingSpeed = 270;

if (article) {
   const text = article.textContent;
   const filterWordsRegExp = /[^\s]+/g; // ^ means not | \s means space | + means more than once | g means globally
   const words = text.matchAll(filterWordsRegExp);
   const wordCount = [...words].length;
   const timeToRead = (wordCount / readingSpeed).toString();
   const decimalPlace = timeToRead.indexOf(".");
   const readingTime = timeToRead.slice(0, decimalPlace + 3);
   const readingTimeElement = document.createElement("p");
   readingTimeElement.classList.add("color-secondary-text", "type--caption");
   readingTimeElement.textContent = `⏱️ ${readingTime} min read`;

   const heading = article.querySelector("h1");
   const date = article.querySelector("time")?.parentNode;

   (date ?? heading).insertAdjacentElement("afterend", readingTimeElement);
}
