// @ts-nocheck

const prompt = require("prompt-sync")({ sigint: true});
const puppeteer = require("puppeteer");
const fs = require('fs');

async function askWhichSong(listSize){

  let answer = prompt('\nPick The Index Of The Song You Want: ');

  if (answer > listSize.length || answer < 0 || isNaN(answer) || answer == '') {
    console.log(`${answer} is not a valid option!\n`);
    return await askWhichSong();
  }else{
    console.log(`\nYou Selected '${answer}' Successfully!`);
    return parseInt(answer);
  }
}

async function search_song(page, songName, index){
  try{
    //index is referred to the current song you are searching. => firstSong? use index=1
    await page.waitForSelector('#root > div > div.background-overlay > div.overlay-rave-container.overlay-rave-small-logo > div.overlay-rave-bottom.overlay-rave-pads.overlay-rave-bind-height > div > div.mix > div > div.mix-search-outer > div.iphone-xify-sides > div > input');
    await page.type('#root > div > div.background-overlay > div.overlay-rave-container.overlay-rave-small-logo > div.overlay-rave-bottom.overlay-rave-pads.overlay-rave-bind-height > div > div.mix > div > div.mix-search-outer > div.iphone-xify-sides > div > input', songName);
    await page.keyboard.press('Enter');
    
    await page.waitForSelector('.search-results');
    await page.click('#root > div > div.background-overlay > div.overlay-rave-container.overlay-rave-small-logo > div.overlay-rave-bottom.overlay-rave-pads.overlay-rave-bind-height > div > div.mix > div > div.mix-search-outer > div.mix-search-results-container > div > div:nth-child(1)') 

    const elementExists = await page.evaluate(() => {
      const element = document.querySelector(`#root > div > div.background-overlay > div.overlay-rave-container.overlay-rave-small-logo > div.overlay-rave-bottom.overlay-rave-pads.overlay-rave-bind-height > div > div.mix > div > div.tracklist > div:nth-child(${index})`);
      return !!element;
    });

    if(!elementExists){
      return search_song(page, songName, index);
    }

  }catch{}
  
  console.log(`${songName} added.`)
}

async function mashup(song1, song2){
  try{
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--start-maximized', 
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 0, height: 0 });

    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
    await page.setUserAgent(ua);

    await page.goto('https://rave.dj/mix', {
      waitUntil: "networkidle0",
    });

    await page.waitForSelector('#qc-cmp2-ui > div.qc-cmp2-footer.qc-cmp2-footer-overlay.qc-cmp2-footer-scrolled > div > button.css-47sehv')
    await page.click('#qc-cmp2-ui > div.qc-cmp2-footer.qc-cmp2-footer-overlay.qc-cmp2-footer-scrolled > div > button.css-47sehv')
        
    await search_song(page, song1, 1)
    await search_song(page, song2, 2)

    let finalURL ='';

    await page.setRequestInterception(true);

    page.on('request', (request) => {
      const requestURL = request.url();
      
      if (requestURL.startsWith('https://api.red.wemesh.ca/ravedj/content?id=') || requestURL.startsWith('https://api.red.wemesh.ca/ravedj/dj/self/content')) {

        if(page.url().toString() != 'https://rave.dj/mix'){
          finalURL = page.url();
        }
      }
      
      request.continue();
    });

    await page.waitForSelector('#root > div > div.background-overlay > div.overlay-rave-container.overlay-rave-small-logo > div.overlay-rave-bottom.overlay-rave-pads.overlay-rave-bind-height > div > div.mix > div > button', {
      timeout: 10000,
    })
    await page.click('#root > div > div.background-overlay > div.overlay-rave-container.overlay-rave-small-logo > div.overlay-rave-bottom.overlay-rave-pads.overlay-rave-bind-height > div > div.mix > div > button')


    await page.waitForSelector('#root > div > div.background-overlay > div.overlay-rave-container.overlay-rave-small-logo > div.overlay-rave-bottom.overlay-rave-pads.overlay-rave-bind-height > div > div.mix > div > button', {
      timeout: 10000,
    })
    await page.click('#root > div > div.background-overlay > div.overlay-rave-container.overlay-rave-small-logo > div.overlay-rave-bottom.overlay-rave-pads.overlay-rave-bind-height > div > div.mix > div > button')


    await browser.close();

    console.log(`\nLINK MASHUP: ${finalURL}`);
    return;
  }
  catch (error){
    console.log(error)
  }

}

async function search_and_save_html(url, file){
  try{

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--start-maximized', 
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 0, height: 0 });

    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
    await page.setUserAgent(ua);

    await page.goto(url, {
      waitUntil: "networkidle0",
    });

    console.log('wait...')

    
    //cookies
    try{
      await page.waitForSelector(
        '#sd-cmp > div.sd-cmp-2E0Ye > div:nth-child(1) > div > div > div > div > div > div.sd-cmp-WgGhS.sd-cmp-TVq-W > div:nth-child(3) > button',
        { timeout: 100000 }
      );
      await page.click('#sd-cmp > div.sd-cmp-2E0Ye > div:nth-child(1) > div > div > div > div > div > div.sd-cmp-WgGhS.sd-cmp-TVq-W > div:nth-child(3) > button')
    }
    catch{}

    const html = await page.content();
    fs.writeFileSync(file, html, 'utf-8');

    await browser.close();
  }
  catch (error){
    console.log(error)
  }

}

async function scrape_html(regex, file){
    let htmlContent = fs.readFileSync(file, 'utf-8');
    let matches = htmlContent.match(regex);
    let uniqueMatches = [...new Set(matches)];

    let matchesLinks = uniqueMatches.map(match => `https://tunebat.com${match}`);

    //console.log(matchesLinks);

    return matchesLinks
}

async function main(input){

  const my_link = `https://tunebat.com/Search?q=${encodeURIComponent(input)}`
  //console.log('\nLINK: '+ my_link)


  //////////          FIRST SONG          //////////

  await search_and_save_html(my_link, 'output1.html');
  let first_round_links = await scrape_html(/\/Info\/[^'"]+/g, 'output1.html');

  let first_matchesTitles = first_round_links.map((url) => {
    let parts = url.split('/'); 
    let secondToLastPart = parts[parts.length - 2]; 
    return secondToLastPart; 
  });

  console.log('\n-----------------------------------------------------------------------\n')
  for(let j=0; j<first_matchesTitles.length; j++){
    a=j
    if (j<10){
      a='0'+j
    }
    console.log(`${a} | ${first_matchesTitles[j]}`)
  }

  let indexFirstSong = await askWhichSong(first_round_links)
  console.log('\n-----------------------------------------------------------------------\n')

  const firstSong = first_matchesTitles[indexFirstSong].replace(/[^a-zA-Z0-9\s]/g, ' ')
  //console.log(firstSong)
  //////////////////////////////////////////////////

  let new_link = first_round_links[indexFirstSong]
  //console.log(new_link)


  //////////         SECOND SONG         //////////

  await search_and_save_html(new_link, 'output2.html');
  let second_round_links = await scrape_html(/\/Info\/[^'"]+/g, 'output2.html');

  let second_matchesTitles = second_round_links.map((url) => {
    let parts = url.split('/'); 
    let secondToLastPart = parts[parts.length - 2]; 
    return secondToLastPart; 
  });

  console.log('\n-----------------------------------------------------------------------\n')
  for(let j=0; j<second_matchesTitles.length; j++){
    a=j
    if (j<10){
      a='0'+j
    }
    console.log(`${a} | ${second_matchesTitles[j]}`)
  }

  let indexSecondSong = await askWhichSong(second_round_links)
  console.log('\n-----------------------------------------------------------------------\n')

  const secondSong = second_matchesTitles[indexSecondSong].replace(/[^a-zA-Z0-9\s]/g, ' ')
  //console.log(secondSong)

  //////////////////////////////////////////////////

  await mashup(firstSong, secondSong)
  
}

main('bello figo al pranzo');
