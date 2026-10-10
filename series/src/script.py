"""FOURTH QUARTER — a 5-episode NFL short-form drama.

Each line: (speaker, text, options). Speakers: MARCUS, COACH, ANNOUNCER.
options: scene, play (event -> keyword), fx, score.
"""

SERIES = "FOURTH QUARTER"

VOICES = {
    "MARCUS":    dict(voice="en-US-AndrewNeural",      rate="+4%",  pitch="+0Hz"),
    "COACH":     dict(voice="en-US-ChristopherNeural", rate="-1%",  pitch="-6Hz"),
    "ANNOUNCER": dict(voice="en-US-GuyNeural",         rate="+14%", pitch="+2Hz"),
}

EPISODES = [
    dict(
        num=1, title="THE CALL", music="Rising_Game.mp3", music_start=0,
        next="FILM ROOM",
        lines=[
            ("COACH",  "Reed. Sit down. We need to talk.", dict(scene="office")),
            ("MARCUS", "Coach, if this is about the playbook, I swear I studied every single page.", {}),
            ("COACH",  "It's not the playbook. Carter tore his A C L this afternoon. He's done for the season.", {}),
            ("MARCUS", "Wait... then who's starting on Sunday?", {}),
            ("COACH",  "You are, rookie. Prime time. Seventy thousand people. And the Wolves defense.", dict(fx="boom")),
            ("MARCUS", "Coach, I've taken three snaps in this league. Three.", dict(scene="locker")),
            ("COACH",  "Then make the fourth one count. I didn't draft you to sit on a bench.", {}),
            ("MARCUS", "Nobody out there believes in me.", dict(scene="practice_sunset")),
            ("COACH",  "I do. That's the only vote that matters this week. Film room. Six A M. Don't be late.", {}),
        ],
    ),
    dict(
        num=2, title="FILM ROOM", music="Hitman.mp3", music_start=0,
        next="PICK SIX",
        lines=[
            ("COACH",  "Freeze it right there. Tell me what you see.", dict(scene="film", board="base")),
            ("MARCUS", "Cover two. Two safeties deep. I hit the slant before they rotate.", dict(board="cover2")),
            ("COACH",  "Look again. Number twenty-four. Watch his feet.", dict(board="circle24")),
            ("MARCUS", "He's creeping down... It's a disguise. They show two, but they're playing cover three.", dict(board="cover3")),
            ("COACH",  "That's Darius King. Best safety in the league. He'll bait you all night long.", dict(board="lookoff")),
            ("MARCUS", "So I look him off. Eyes left... then throw right.", dict(scene="practice")),
            ("COACH",  "Now you're thinking like a quarterback. Not a college kid with a cannon.", {}),
            ("MARCUS", "Coach... what if I freeze out there?", dict(scene="tunnel")),
            ("COACH",  "Then you breathe. You find number twenty-four. And you play football.", {}),
        ],
    ),
    dict(
        num=3, title="PICK SIX", music="Volatile_Reaction.mp3", music_start=0,
        next="THE SCAR",
        lines=[
            ("ANNOUNCER", "Third and seven. Stallions trail by three. Reed drops back... he fires over the middle...",
             dict(scene="play", play="intercept", score=(14, 17, "3RD", "4:12"),
                  keys=dict(snap="drops", throw="fires"))),
            ("ANNOUNCER", "Intercepted! King jumps the route! He's at the forty, the twenty... pick six!",
             dict(scene="play", play="intercept", cont=True, keys=dict(catch="Intercepted!", score="six!"),
                  fx="intercept", score_after=(14, 24))),
            ("MARCUS", "He was baiting me! I saw it, and I threw it anyway!", dict(scene="sideline", score=(14, 24, "3RD", "3:58"))),
            ("COACH",  "Helmet off. Look at me. Not the scoreboard. Me.", {}),
            ("MARCUS", "We're down ten, Coach. This whole stadium wants me benched.", {}),
            ("COACH",  "This whole stadium didn't watch you study until two in the morning. I did.", {}),
            ("MARCUS", "Then put Morris in. Maybe he won't choke.", dict(scene="bench")),
            ("COACH",  "Morris isn't the answer. You are. One bad throw doesn't write your story, son.", {}),
        ],
    ),
    dict(
        num=4, title="THE SCAR", music="Impact_Prelude.mp3", music_start=0,
        next="FOURTH AND GOAL",
        lines=[
            ("COACH",  "You want to know why I really coach, Marcus?", dict(scene="bench", score=(17, 21, "4TH", "2:00"))),
            ("MARCUS", "Because you love the game?", {}),
            ("COACH",  "Because in nineteen ninety-eight, I threw four interceptions in a playoff game. Four.", {}),
            ("MARCUS", "You? No way. You were a Pro Bowler.", {}),
            ("COACH",  "After that game. Not before. I almost quit that night. My coach wouldn't let me.", dict(scene="sideline")),
            ("MARCUS", "What did he tell you?", {}),
            ("COACH",  "The scoreboard tells you what happened. It never tells you who you are.", dict(fx="boom")),
            ("MARCUS", "Then let's go show them who I am.", {}),
            ("ANNOUNCER", "Stallions ball. Down four. Two minutes to go, and ninety yards to paradise.",
             dict(scene="broadcast")),
        ],
    ),
    dict(
        num=5, title="FOURTH AND GOAL", music="Five_Armies.mp3", music_start=0,
        next=None,
        lines=[
            ("ANNOUNCER", "Fourth and goal from the eight. Eight seconds left. This is it.",
             dict(scene="broadcast", score=(17, 21, "4TH", "0:08"))),
            ("COACH",  "Hawk thirty-two, flood right. You know who to watch.", dict(scene="sideline")),
            ("MARCUS", "Number twenty-four.", {}),
            ("COACH",  "Eyes left. Make him bite. Then let it fly.", {}),
            ("MARCUS", "Coach... thank you for believing in me.", {}),
            ("COACH",  "Thank me in the end zone. Go!", dict(fx="whistle")),
            ("ANNOUNCER", "Reed takes the snap... looks left... King bites! Reed fires to the corner...",
             dict(scene="play", play="touchdown", keys=dict(snap="snap...", look="left...", bite="bites!", throw="fires"))),
            ("ANNOUNCER", "Caught! Touchdown Stallions! The rookie has done it!",
             dict(scene="play", play="touchdown", cont=True, keys=dict(catch="Caught!"), fx="touchdown",
                  score_after=(23, 21), clock_after="0:00")),
            ("MARCUS", "We did it, Coach! We actually did it!", dict(scene="celebrate", score=(23, 21, "FINAL", "0:00"))),
            ("COACH",  "No, son. You did. Welcome to the N F L.", dict(scene="press")),
        ],
    ),
]
