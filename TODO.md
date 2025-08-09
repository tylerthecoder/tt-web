# TODO

## Project: Sync notes with google docs

The hard part here is testing. I want to be able to test my converters. So I should download some google docs locally and save their content and write the markdown I expect to see.

## Project: Sync notes with local files

The local notes are stored as a different version on the note. You update the local version by pushing from the local file via cli.

The local version can also sync the files to the machine. The diffs are handled with git? Might be a good way to learn gitree or whatever the local git cli is.

The local cli reads a .notes file that specifies the files in the directory that are synced. The file path of the note is stored as a tag on the note.

## Project: Sync conflict resolution

I need a UI that lets me handle conflicts with syncing. This will be hard since there aren't built in solutions for this. One

## Project: Refactor to use google auth for everything
