const puppeteer = require("puppeteer");
const fs = require("fs");
// const proxyChain = require('proxy-chain');

// let delay = 10000; // Random delay between 5 and 15 seconds
// let smallDelay = 10000; // Random delay between 5 and 15 seconds
let delay = Math.floor(Math.random() * 10000) + 5000; // Random delay between 5 and 15 seconds
let smallDelay = Math.floor(Math.random() * 10000) + 5000; // Random delay between 5 and 15 seconds
let xsDelay = Math.floor(Math.random() * 7000) + 1000; // Random delay between 5 and 15 seconds

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let pageNum = 8;
  let startWithProfile = true;
  let state = "NY"; //NJ:2,  NY, PA, CT, TX, CA, FL, CO, GA, IL, OR, WA
  // await page.goto("https://doulamatch.net/list/birth/ny/1", {
  // await page.goto("https://doulamatch.net/list/birth/nj/1", {
  await page.goto(`https://doulamatch.net/list/birth/${state}/${pageNum}`, {
    waitUntil: "networkidle0",
  });

  let hasNextPage = true;
  let doulaProfilesSet = new Set();

  while (hasNextPage) {
    await new Promise((resolve) => setTimeout(resolve, smallDelay));

    const doulaProfiles = await page.$$eval(".search-result-doula a", (links) =>
      links.map((a) => a.href)
    );

    for (let profile of doulaProfiles) {
      doulaProfilesSet.add(profile);
    }

    for (let profile of doulaProfilesSet) {
      await new Promise((resolve) => setTimeout(resolve, xsDelay));

      await page.goto(profile, { waitUntil: "networkidle0" });
      await new Promise((resolve) => setTimeout(resolve, delay));

      // const profileTextNav = await page.$eval(
      //   ".profilenav",
      //   (div) => div.innerText
      // );
      console.log("profile", profile);
      let profileTextNav;
      try {
        profileTextNav = await page.$eval(
          ".profilenav",
          (div) => div.innerText
          );
          console.log("profileTextNav", profileTextNav);
      } catch (error) {
        console.error("An error occurred:", error);

        const content = await page.content();

        if (content.includes("<h2>Quota Exceeded</h2>")) {
          console.error("Quota Exceeded error found on the page");
          // await page.screenshot({
          //   path: `./dataCollection/screenshots/${state}/errors/quotaexceeded.png`,
          // });
          await browser.close();
        } else {
          console.log("Quota Exceeded error not found on the page");
          // await page.screenshot({
          //   path: `./dataCollection/screenshots/${state}/errors/failedtogetnav${profile
          //     .split("/")
          //     .pop()}.png`,
          // });
        }
      }

      const profileTextTestimonials = await page.$$eval(
        ".row.testimonial",
        (divs) => {
          return divs
            .map((div) => {
              return div.innerText;
            })
            .join("\n\n\n");
        }
      );
      const profileText = await page.$eval(
        ".row.tab-content",
        (div) => div.innerText
      );

      let allProfileTexts = `${profileTextNav}\n\n${profileText}\n\n${profileTextTestimonials}`;

      fs.writeFileSync(
        `./dataCollection/dataList/${state}/${profile.split("/").pop()}.txt`,
        allProfileTexts
      );
      await new Promise((resolve) => setTimeout(resolve, smallDelay));

      let doulaName = profile.split("/").pop();
      let entries = [];

      let emails =
        allProfileTexts.match(
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
        ) || [];
      let websiteEmailsArr =
        allProfileTexts.match(
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
        ) || [];
      let websiteEmailsContactArr =
        allProfileTexts.match(
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
        ) || [];
      let websites =
        allProfileTexts.match(
          /\b(?:https?|ftp):\/\/[\-A-Z|a-z|0-9]+(?:[\-A-Z|a-z|0-9]+)*\.(?:[A-Z|a-z]{2,})(?:[\/|\.]?[A-Za-z0-9\-]*)*(?:\.[A-Za-z]{2,6})?(?:\/[A-Za-z0-9\-]*)*(?:\?[A-Za-z0-9\-\._\?\,\'\/\\\+&amp;%\$#\=~]*)?(?:#[A-Za-z0-9\-\._]*)?\b/g
        ) || [];
      let phoneNumbers =
        allProfileTexts.match(
          /\b(?:\+?1[-.])?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g
        ) || [];

      // Format name, website, number, and email entries
      entries.push(`Name: ${doulaName}`);

      if (websites.length > 0) {
        websites.forEach((website) => entries.push(`Website: ${website}`));
      }
      if (websites.length > 0) {
        console.log("websites", websites);
        await new Promise((resolve) => setTimeout(resolve, smallDelay));

        // Click on the website and look for the email
        // await page.goto(websites[0], { waitUntil: "networkidle0" });
        try {
          // await page.goto('https://www.comfortcaredoula.com', { waitUntil: "networkidle0" });
          await page.goto(websites[0], { waitUntil: "networkidle0" });
          // await new Promise((resolve) => setTimeout(resolve, smallDelay));

          const emailLinks = await page.$$eval('a[href^="mailto:"]', (links) =>
            links.map((link) =>
              link.getAttribute("href").replace("mailto:", "")
            )
          );

          const uniqueEmailLinks = [...new Set(emailLinks)];

          if (uniqueEmailLinks.length > 0) {
            console.log(uniqueEmailLinks); // This will output an array of unique email addresses
            uniqueEmailLinks.forEach((emailLink) =>
              entries.push(`emailLinksArr: ${emailLink}`)
            );
          }

          const instagramLinks = await page.$$eval(
            'a[href*="instagram.com"]',
            (links) => links.map((link) => link.getAttribute("href"))
          );

          const uniqueInstagramLinks = [...new Set(instagramLinks)];

          if (uniqueInstagramLinks.length > 0) {
            console.log(uniqueInstagramLinks); // This will output an array of unique Instagram URLs
            uniqueInstagramLinks.forEach((instagramLink) =>
              entries.push(`instagramLinksArr: ${instagramLink}`)
            );
          }

          // Search for email on the page
          let websiteEmails = await page.$$eval("body", (bodyElements) => {
            let regex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
            return bodyElements[0].innerText.match(regex) || [];
          });
          const uniqueWebsiteEmails = [...new Set(websiteEmails)];

          uniqueWebsiteEmails.forEach((webEmail) =>
            entries.push(`websiteEmailsArr: ${webEmail}`)
          );

          console.log("websiteEmails", websiteEmails);

          if (websiteEmails.length === 0) {
            const selector = 'a[href*="contact"]';
            const contactLink = await page.$(selector);

            if (contactLink) {
              const href = await page.evaluate(
                (el) => el.getAttribute("href"),
                contactLink
              );

              // Extract the base URL from the current page URL
              const baseURL = new URL(await page.url()).origin;

              // Create an absolute URL
              const absoluteURL = new URL(href, baseURL).href;
              console.log("before  contact page", absoluteURL);

              await new Promise((resolve) => setTimeout(resolve, smallDelay));
              console.log("went to contacsmallDelaye");

              try {
                await page.goto(absoluteURL, {
                  waitUntil: "networkidle0",
                  timeout: 60000,
                });
                console.log("Navigated to contact page");
              } catch (error) {
                console.error(
                  "Error while navigating to contact page:",
                  error.message
                );
                await page.screenshot({
                  path: `./dataCollection/screenshots/${state}/errors/${profile
                    .split("/")
                    .pop()}navigatingtodoulawebcontact.png`,
                });
              }
              await new Promise((resolve) => setTimeout(resolve, smallDelay));

              try {
                const websiteEmails2 = await page.$$eval(
                  "a, div, span, p",
                  (elements) => {
                    console.log("elements", elements);
                    const regex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
                    const emails = [];

                    elements.forEach((element) => {
                      const text = element.innerText;
                      const matches = text.match(regex);
                      if (matches) {
                        emails.push(...matches);
                      }
                    });

                    return emails;
                  }
                );

                console.log("websiteEmails 2", websiteEmails2);
                const uniqueWebsiteEmailsContactPage = [
                  ...new Set(websiteEmails2),
                ];

                uniqueWebsiteEmailsContactPage.forEach((email) =>
                  entries.push(`websiteEmailsContactArr: ${email}`)
                );

                console.log("push email");
              } catch (error) {
                console.error(
                  "Error while pushimg emails to contact page:",
                  error.message
                );
                await page.screenshot({
                  path: `./dataCollection/screenshots/${state}/errors/${profile
                    .split("/")
                    .pop()}gatheringdoulawebcontactemails.png`,
                });
              }
            }
          }
          // Rest of your code after successful navigation
        } catch (error) {
          console.error("navigatingtodoulaweb:", error.message);
          try {
            await page.goto(profile, { waitUntil: "networkidle0" });
          } catch (error) {
            console.error(`Failed to navigate to profile: ${error}`);
          }
          // try {
          //   await page.screenshot({
          //     path: `./dataCollection/screenshots/${state}/errors/${profile
          //       .split("/")
          //       .pop()}navigatingtodoulaweb.png`,
          //   });
          //   await page.goto(profile, { waitUntil: "networkidle0" });
          // } catch (error) {
          //   console.error(
          //     "An error occurred while taking a screenshot for error:",
          //     error
          //   );
          //   await page.goto(profile, { waitUntil: "networkidle0" });
          // }
        }

        // Add the website's emails to the existing list of emails
        // emails = [...emails, ...websiteEmails];
        await new Promise((resolve) => setTimeout(resolve, smallDelay));

        // Return to the original profile
        await page.goto(profile, { waitUntil: "networkidle0" });
      }

      if (phoneNumbers.length > 0) {
        phoneNumbers.forEach((phoneNumber) =>
          entries.push(`Number: ${phoneNumber}`)
        );
      }

      if (emails.length > 0) {
        emails.forEach((email) => entries.push(`Email: ${email}`));
      }

      if (entries.length > 0) {
        const formattedEntry = entries.join("\n");
        // fs.appendFileSync(`./profileTexts/emailsOnly/${state}/doulas${state}.txt`, `${formattedEntry}\n\n`);
        fs.appendFileSync(
          `./dataCollection/dataList/${state}/doulas${state}.txt`,
          `${formattedEntry}\n\n`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, smallDelay));

      await page.screenshot({
        path: `./dataCollection/screenshots/${state}/${profile
          .split("/")
          .pop()}.png`,
      });

      await new Promise((resolve) => setTimeout(resolve, smallDelay));

      // await page.goBack({ waitUntil: "networkidle0" });
      await page.goto(`https://doulamatch.net/list/birth/${state}/${pageNum}`, {
        waitUntil: "networkidle0",
      });
    }

    let nextPageLink = await page
      .$eval(".pagination.search-pager .page-item:last-child a", (a) => a.href)
      .catch(() => false);

    if (nextPageLink) {
      pageNum = pageNum + 1;
      console.log(`going to page ${pageNum}`);
      await page.screenshot({
        path: `./dataCollection/screenshots/${state}/${pageNum}.png`,
      });
      await new Promise((resolve) => setTimeout(resolve, smallDelay));
      await page.goto(nextPageLink, { waitUntil: "networkidle0" });
    } else {
      hasNextPage = false;
    }

    doulaProfilesSet.clear();
  }

  // await page.screenshot({
  //   path: `./screenshots/${state}/browser_close.png`,
  // });

  // await browser.close();
})();
