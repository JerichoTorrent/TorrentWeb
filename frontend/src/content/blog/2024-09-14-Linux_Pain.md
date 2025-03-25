---
layout: post
title: "Linux Pain"
date: 2024-09-14 0:43:00 +0000
author: JerichoTorrent
categories: Dev
tags: [Linux, OCI, Ubuntu, VM]
comments: true
---

A great Linux quote I heard once was "It is not Linux's job to prevent you from shooting yourself in the foot. It is Linux's job to deliver Mr. Bullet to Mr. Foot in the most efficient way possible." I experienced that over the last few days.

Context: I have an Oracle Cloud virtual machine running, where I host this blog, the SkyFactions-web interface, and Kish's modded server, as well as a few other small-scale web deployments. It's an important part of the infrastructure for testing purposes and having access to resources for deploying applications. The instance runs on Ubuntu 22.04 (which is quickly becoming my favorite distro.) I recently installed a GPTs integration written in Go that gives ChatGPT direct access to my machine... scary I know. Surprisingly, ChatGPT doesn't do anything stupid unless told to, just like the Linux user himself. Here comes me realizing the user accessing the machine via SSH had very limited access (as intended) to the file system without sudo. The GPTs integration runs in docker, so in the containerized environment it didn't have much access on the machine. I suppose this was intentional for good reason.

<!--more-->
Anyway, long story short I ended up rinsing my machine with `chmod`, `chgrp` and `chown` and somewhere down the line I prevented the one user that had SSH access from accessing the machine any longer. Once I logged out for the night, it was over. Root login was disabled, so I was cooked. Then came about a 3 day painful session of trying to boot Ubuntu into recovery mode, but getting locked out of the boot manager one way or another. Oracle Cloud has a few ways of accessing the console when you did something stupid and locked yourself out. You can use VNCViewer, which doesn't work on Ubuntu because of something related to the GUI. You can try connecting with powershell, but won't be able to `esc` into the boot manager. Lastly, you can use their cloud shell console, which was the most frustrating experience of my life. Either I hit `esc` too many times and get stuck in GRUB, or I don't hit it enough times and it boots like normal.

Finally, I detached the boot volume from the instance and attached it as a secondary volume of a new instance. I reset the SSH keys, and fixed the permissions for the user. Then, I detached the volume from the second instance and attached it to the first one as a boot volume. Magically, I was good to go with all my files intact. It only cost me $1 for 30 minutes of extra storage and 3 days of my time that I can never get back. But, I learned a lot, mostly about what not to do on my machine. All this for ChatGPT. Damn you, Pip.

Overall, I love Linux. Using Linux for long enough really makes you hate Windows, their telemetry, their bloat, and their God-forsaken "Recall" feature coming soon. You also can't run a *good* Minecraft server on Windows, or really any gameserver or web deployment. If it weren't for lack of support for Adobe and a lot of features of modern gaming, I would've switched to a Linux distro long ago as my daily driver. All that being said, the main thing Windows has going for it is the shooting-of-foot-prevention. It's really hard to do something so dumb on Windows that you nuke your entire machine, but with Linux, you can breathe wrong and your files are inaccessible or flushed down the kernel's proverbial toilet.