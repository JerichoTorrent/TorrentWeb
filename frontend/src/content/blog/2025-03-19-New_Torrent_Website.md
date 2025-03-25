---
layout: post
title: "New Torrent Website"
date: 2025-03-19 13:35:00 +0000
author: JerichoTorrent
categories: Dev
tags: [Website, Integrations, Updates, Deployments, Dev, Infrastructure]
comments: true
excerpt_separator: <!--more-->
---

On my Discord profile, my status has been "Building a website" for like 3 months now. Turns out, I was prophesizing my IRL digital marketing business the whole time, and I just finished the first iteration of the landing page. It's quite nice but I would have to doxx myself to share it, so I'll table that for now. Anyway, during this excursion I have been diving down the rabbit hole of React + Typescript and running the development server on Oracle Cloud. At a certain point during this project, I realized this framework would be absolutely fantastic for the new Torrent Website.

I set up a new project on my home PC using Vite + React and Typescript with an Express.js and MySQL backend. If you're tech savvy, you might already have an idea of what I'm planning to do. My ultimate dream is to have a full-fledged Minecraft server website and utilize SEO to greatly drive traffic to the server, as well as have an amazing portal for all things Torrent Network on the web. The current Torrent website is honestly crap; the redirects don't work and it is really just a bland website template. It's ugly and I hate it. The new site will have a ton of improvements and new features. The roadmap looks something like the following.
<!--more-->

# Front End  

As a React web app, the front end should expose a beautiful landing page with several links and integrations. Behind the splash text and graphics will be a three.js animated background, with blazing fast speed and performance. I plan to have our logo plastered at the very top, with a Minecraft player list integration (click to copy) to the left and a Discord (click to join) integration on the right. Finally there will be search bar to find anything on the site, and a newsletter sign up using Brevo API and ClickFunnel integrations. Below it will be the navbar, with several subpages.

## Pages  

- Home | Landing page/index
- Rules | Broken into global, per-server, and discord rules
- Vote | All voting links and an integration into your player profile to show your total votes and voting points; more on that later
- Map | A full-page embed of our live server map
- Wiki | Either migrate the entire codebase to React + Typescript or a link to the wiki (let's be real I'm probably going to stick with the latter because pain)
- Punishments | This will be the same punishments page you know and love at <https://bans.torrentsmp.com> but with an integrated ban appeal/automated email system complete with a Discord webhook for staff to review appeals, plus some prettification
- Forum | The photos page will be replaced with an actual forum, where logged-in users can create threads of all kinds and interact with the community
- Blog | Again, either migrating the codebase, embedding it as-is, or using a link. I think it would probably be best to migrate the codebase since it looks pretty janky having multiple nav-bars and a complete change in theme. I do hope to stick with the markdown integration because writing blog posts in markdown is a huge W. **I like markdown**.
- Affiliates | We will be expanding upon our affiliates page to further cultivate our partnerships with other companies and servers

## Profile  

To the right of the navbar will be your profile dropdown. From there you can click on your name or profile picture (Minecraft skin using an API like crafatar) to view your player profile. If not logged in, you will be prompted to log in or register; more on that later. Also in the dropdown will be your notifications, friends, settings, and threads. Clicking on your profile will show your own personalization and personality. You can post statuses directly to your profile to show people what you're thinking about or what projects you are doing on the server. You can view your threads that you've posted to the website. This will also have a section for your stats. You can see a preview of what this might look like by doing `/profile` in-game on Survival or Lifesteal; this section will show something similar. This is likely going to be the most complex part of this project to code.

# Back End  

By using MySQL and Express.js, I will be storing and fetching a ton of data from the database like tokens, stats, votes, bans, etc. This will be an integration with **a ton** of our plugins/code on the server, as well as several of our web deployments. So far at the time of writing this, I've started building out the tables of the database and have a MySQL server running locally on my PC for testing. The API connects to the MySQL server first and foremost, and the frontend connects to the backend API. This is the first thing I coded. When I run the dev server for the front-end, it tries to communicate with the API, which then tries to communicate with the MySQL server. The API is protected by JWT Middleware to ensure the routes are secure.

## Login System  

The login system is two-fold, you can either log in on the website with an automated email system that sends you a magic link, or you can login in-game by typing `/login` on any server, which sends you a magic link in chat that you can click. Once registered, you can customize your profile by setting your status and more. The login system works with authentication routes using MySQL and JWT. The emails are sent using Brevo API. POST requests are sent to the backend and a magic link is generated, then stored for 15 minutes.

# The Power of SEO  

Search Engine Optimzation is an extremely powerful system. This is mainly what inspired building this new site. If you google "Minecraft Server", you will find many hosting providers, the official Minecraft website, and Minecraft server listing sites. These sites obviously have great SEO, since they rank so high on Google. Finally, on the 5th page you see an actual Minecraft server you can join, Complex Gaming. Even if you search "Minecraft Server to Join" you will only find an actual server you can join on the 2nd page, Pika Network. I always thought it would be worthwhile to optimize for certain keywords so people can find our server more easily and drive more traffic to the network.

The brass-tacks of utilizing SEO are to add a ton of backlinks that lead to your website, optimize the site using certain keywords, metadata, and having many pages that target certain niches. Our servers fill the void of many niches that certain players specifically look for, like servers with lore, dungeons, custom items, etc. These are our keys to success. Plus, just having a better looking and more enjoyable "app" to use drives traffic from people clicking through your site and web-crawlers easily being able to crawl through each page in succession.

# Conclusion  

The new Torrent Website will be a full-suite integration of all of our web deployments, servers, and player data. You can view the codebase here <https://github.com/JerichoTorrent/TorrentWeb> and if you're handy, feel free to submit a pull request if there's anything you want to tweak or help out with. Contact me via email <staff@torrentsmp.com> or Discord (JerichoTorrent) if you wish to contribute. Thanks for reading! Cheers to more web deployments from Torrent Network!