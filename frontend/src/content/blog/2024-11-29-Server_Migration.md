---
layout: post
title: "Server Migration"
date: 2024-11-29 16:30:00 +0000
author: JerichoTorrent
categories: Network
tags: [Minecraft, Dev, Linux, Server, Hardware]
comments: true
excerpt_separator: <!--more-->
---

# Our History With Providers

Due to a combination of bad luck and false advertising, our entire history of working with providers has been poor. Our first provider in 2020 was Apex. At the time, they had bad hardware and the information about the CPUs they used was not publicized. Their panel, Multicraft, is extremely slow and poorly optimized. We had many prevalent issues with them, and due to a billing issue my server ended up being wiped from existence.

2 years later, I opened a server with Shockbyte, another low tier provider with many issues. They also use Multicraft, have low tier CPUs, bad routing, and have some ridiculous policies in their ToS. For some reason, they actually have a policy against using high resolution map software, which is a very strange thing to prohibit. This was another really low quality provider I would never recommend to anyone, though they seem to dominate Google search results.

In mid-2023, we moved to a completely unregistered business that was basically just a guy in his basement. He claimed to be an experienced system administrator, and in some senses he was, but knew absolutely nothing about game servers. My server was poorly optimized, laggy, on very old hardware, and was a mess. About a month after we moved to this provider, he transferred my server to a new SSD and it corrupted all of my files. I restored from an old backup, and immediately started looking for a new host. That was when we moved to Bloom.host.

<!--more-->
Upon migrating to Bloom, I created a network to link our servers together using Velocity, a server implementation where the public facing instance is a proxy server, with backend servers behind it functioning as the actual gamemodes. Immediately, the node they put my server on was torched, so I had to request a node transfer. We had mostly normal operations, but the performance was not all that great considering we were overpaying for a CPU that is not that performant (a Ryzen 7 3750X). Eventually, we started getting really bad packet loss due to issues with their routing to Ashburn, VA. This was about 9 months of using them as a provider.

As our needs to expand arose during the development of SkyFactions and Lifesteal Season 2, we moved to a KVM based virtual dedicated server provider, Netcup. This was our worst experience yet. The routing has been awful, with players getting ping spikes regularly up to 20k and getting disconnected often. Our console logs are filled with timeouts. Furthermore, for some reason due to their virtualization or some other hardware issue, memory allocation on our servers is completely unmanageable. Allocated memory increases on our server multiple GB an hour. This has led to us having to restart all of our servers multiple times a day, leading to dropped players and inconvenience. Plus, with what should be enough RAM to run our whole network, we couldn't even turn the SkyFactions server on or the whole machine would crash. We also have needed more disk space than this server could provide. Due to my own bad decisions, we are now locked into a contract with them for the next 9 months. Even though I have sent Netcup's team several benchmarks and a full description of the prevalent issues on our servers, including long tracepaths and system resource monitoring, they have refused to let me out of the contract. So, I am paying a monthly premium for a server I cannot use.

# New Dedicated Server  

At the time of writing this, I am currently finalizing the full-scale migration to our new dedicated server. This server runs on an AMD EPYC 4344P, the most performant CPU we have been able to use to date. We get the full CPU, and 8TB of storage, with 192GB of RAM. This will be more than enough resources to run our servers, by a factor of about 8. We will be able to give more memory to the heap space of each server, increasing performance. We will rarely need to restart our servers, save for updates.

I had to transfer about 600GB worth of files across two dedicated servers using my private network, tailscale. Some of our data was stored in remote databases, so I had to dump the databases, securely copy them to the other server over tailscale, and migrate the databases to the new ones. It was not an easy or simple process, and I had to manage a lot of backups on my local drive for security. Lots of fun. The only thing left to do is reconfigure the webserver for the live map and update the DNS for the domain `torrentsmp.com` so you can still connect with the same address.

# New Lifesteal Update  

We are re-launching with a new lifesteal questline! This questline is a lot of fun, and is our **first branching quest**. The first quest in the series is called **Ancient Builders**. You can start it by heading into the library at spawn and speaking with the Archaeologist "Mari Curian". This quest *will* affect your honor level depending on the choices you make, so choose wisely! Your honor will be very important in the upcoming Guild update.

## New Crate Drop

On December 1st, 2024, we will be dropping a new legendary crate! This will come with an epic new armor and tools set with custom 3D models, all with special never-before-seen custom attributes. We will also fill it with new enchanting items and some special abilities. Stay tuned!

- Torrent