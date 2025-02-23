export const companyContext = {
    GeneralCompanyInfo: `
    Founded in Tel Aviv, Israel, WSC Sports has become a leader in AI-driven sports content automation.
    The company specializes in real-time highlight generation, video editing, and content distribution for sports rights owners, broadcasters, leagues, and teams.
    WSC Sports' AI-powered platform automates the creation of sports content, transforming live games into personalized video highlights instantly.
    `,
    products: `
    AVGen: AVGen allows users to create videos based on rules and logic.
    Users can automate video creation for future games by setting rules.
    Main functionalities:
    Create Video Flow – Users generate on demand videos with a few clicks.
    Add Rule Flow – Users define automation rules for video creation.
    Settings – Users manage basic configurations and social media accounts.
    AVGen is one of the core WSC Sports products, helping users streamline video content generation.

    Clipro (Studio): Clipro is WSC’s video editing and publishing platform.
    This is essentialy an online video editor (think a very simple Premiere) that also has the ability to watch games live and clip from them
    Features include:
    Play-by-Play Clips – Real-time highlight generation. This are automaticly generated short clips that index all the important things that happened in the sport event.
    Editing Tools – Users can capture, edit, and organize clips, and create videos from them
    Publishing & Branding – Clips can be published with custom branding.
    Clipro is central for managing, refining, and distributing sports content, and WSC users spend most of their time there.

    Library: A content management system for organizing video assets.
    Enables users to search, categorize, and retrieve video highlights.
    Works alongside AVGen and Clipro to streamline media operations.
    The library also has features within AVGen and Clipro where users can choose which library folder they want content to be sent to.
    `,
    Users: `
    There are 2 main types of users. Content/Video editors and Content/team leads. 
    The editors usually work in shifts and are working on Clipro watching the live games. They mainly create videos in the Clipro editor or AVGen Create
    The content/team leads are in charge of the content plans and while they work in Clipro, they are also the ones in charge of setting rules in AVGen rules.
    `,
    domains: `
      Growth: This domain is mainly WSC's aims to become more of a B2B2C company. They have an SDK that enables rights holders to create sports content apps very easily where WSC helps them manage content and share with their fans.
      They have enhanced live which is an offering for smart TVs that provides live summaries of games on TV

      Sports: This domain hosts all the logic regarding creating videos and what makes a good video per sport. The logic is called "containers" they hold the steps and prioritization between moments in a game to decide what should and shouldn't go into the video.
      They are also in charge with ingestion. This is all about getting data providers for each customer that provide WSC with the relevant info regarding players teams and plays for that customer
    `,
    terminology: `
      System: A system in WSC holds all the games and event for a specific sports league or tournament. For example, La Liga is a system. Multiple customers can share a system if neccessary. A system has streams under it for each broadcast of the game.

      User group: A user group hosts one or multiple systems and gives users access to them. 

      User Alias: This is a single user. A user has access to one or more user groups, each user groups providing access to one or more systems.

      Rule: Each rule is made up of a trigger, subject, condition (optional), and highlight type. The trigger tells the rule when to start working (for example "post game" is a trigger that tell the rule to start working after the game ends).
      The subject lets the user know what the rule is about (player, team, action, or game). The condition is optional and helps specify the rule to work only when something is met, for example "only send a video if the player had 30+ points).
      The action is the type of content that will be created. For example: game highlight, player highlight, top plays. Example for a rule: game - post game - game highlights. This rule has no condition
      Context: this is a framwork that carries metadata across the rule components (trigger, condition, highlight type) and enables a safe connections between them. GameID for example is a metadata that enables game highlights to be connected with post game trigger. The trigger passes the metadata to the highlight type so that each highlight type that requires GameID can work with it.
    `
  };