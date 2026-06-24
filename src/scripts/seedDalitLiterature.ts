import { prisma } from '../config/database';

// Google Drive folder: https://drive.google.com/drive/folders/1pyCzt7oqkmUq17nRCKXcpQkXKhdVbKur
// Descriptions are original Sangham content (CC_BY). Full PDFs accessible via Drive links.

function driveUrl(id: string) {
  return `https://drive.google.com/file/d/${id}/view`;
}

interface TextSpec {
  id: string;
  title: string;
  author: string;
  year: string;
  driveId: string;
  description: string; // paragraphs separated by \n\n
  archiveIds?: string[];
}

// ── Collection 1: Gail Omvedt ─────────────────────────────────────────────────

const OMVEDT: TextSpec[] = [
  {
    id: 'omvedt-buddhism-india-2003',
    title: 'Buddhism in India: Challenging Brahmanism and Caste',
    author: 'Gail Omvedt',
    year: '2003',
    driveId: '1KTCn47yxc_PbapvdLBimipNiNIIr2g8M',
    description: `Omvedt's landmark intellectual history of Buddhism as a sustained challenge to Brahmanical hierarchy. Drawing on Pali literature, archaeological evidence, and bhakti philosophy, she argues that Buddhism was not merely a spiritual movement but a systematic political and philosophical opposition to caste — one that was ultimately defeated by Brahmanical reaction and slowly absorbed, distorted, or suppressed.

She traces Buddhism's trajectory from its origin in the river-plains of northern India, through the great Buddhist civilisation of the Maurya and Gupta periods, to its defeat and near-disappearance from the subcontinent. She then follows its survival through the bhakti saints — Kabir, Ravidas, Tukaram — who carried its egalitarian spirit without the name. Finally she traces the modern Buddhist revival: Iyothee Thass in Tamil Nadu, Pandita Ramabai, and above all B. R. Ambedkar.

Essential reading for anyone studying the relationship between Buddhism, caste, and Indian history. Omvedt reads the Pali Canon not as theology but as social philosophy, recovering a Dhamma that was always anti-caste and always political. Published by SAGE (2003).`,
  },
  {
    id: 'omvedt-dalits-democratic-revolution-1994',
    title: 'Dalits and the Democratic Revolution: Dr. Ambedkar and the Dalit Movement in Colonial India',
    author: 'Gail Omvedt',
    year: '1994',
    driveId: '1KHJeY0LJvcvlMNTtkOTxJFWM6xQQ0yak',
    description: `A foundational study of the Dalit movement in colonial India (1900–1956), spanning Maharashtra, Andhra, Hyderabad, Mysore, and Karnataka. Omvedt places the Dalit movement at the centre of Indian democratic history — "in many ways the leading part of a broader anti-caste movement which has been the central democratic movement in India."

She examines how Dalit political consciousness emerged in different regions under colonialism, the role of British administrative structures in creating political openings, the tensions between Dalit liberation and the mainstream nationalist movement, and Ambedkar's strategic decisions at key moments — the Round Table Conferences, the Poona Pact, the founding of political parties, and the conversion to Buddhism.

The book provides detailed regional histories that go beyond the Ambedkar-centric narrative, showing how ordinary Dalit men and women organised, agitated, and built institutions across the subcontinent decades before independence. Published by SAGE (1994, reprinted 2011).`,
  },
  {
    id: 'omvedt-seeking-begumpura-2008',
    title: 'Seeking Begumpura: The Social Vision of Anticaste Intellectuals',
    author: 'Gail Omvedt',
    year: '2008',
    driveId: '1KdyrpfDSlW3Ft5_p5lPD2JHaW-uWD5iw',
    description: `An intellectual history of the utopian visions of anticaste thinkers across five centuries — from the bhakti saints of the 15th century to Ambedkar in the 20th. The title comes from Ravidas's song "Begumpura" (city without sorrow) — the first Indian formulation of utopia, a casteless, classless society.

Omvedt traces this utopian thread through Kabir, Ravidas, Tukaram, the Kartabhajas sect, Jotirao Phule, Iyothee Thass (the Tamil Buddhist revivalist), Pandita Ramabai, Periyar, and finally Ambedkar's "Prabuddha Bharat." She argues these anticaste intellectuals had a coherent socioeconomic alternative — not merely a reaction against Brahminism but a positive vision of a new society.

The book challenges the mainstream Indian intellectual tradition's neglect of subaltern political thought. These thinkers, Omvedt shows, were not backward-looking traditionalists but forward-looking modernists with sophisticated theories of social change. Published by Navayana (2008).`,
  },
  {
    id: 'omvedt-ambedkar-enlightened-india',
    title: 'Ambedkar: Towards An Enlightened India',
    author: 'Gail Omvedt',
    year: '2004',
    driveId: '1KPoThF9B2RKy3mUO_76_jKfxZLDK9UjV',
    description: `A concise intellectual biography of Ambedkar written for the Penguin Lives series. Omvedt traces Ambedkar's life from his childhood as the fourteenth child of an Army subedar of the Mahar caste, through his education at Columbia and the London School of Economics, to his emergence as the foremost leader of Dalit India.

She focuses on Ambedkar's ideas rather than simply his political career — his analysis of the caste system, his critique of the Congress and Gandhi, his role in framing the Constitution, and his final conversion to Buddhism days before his death in 1956. Omvedt presents Ambedkar as a national leader of the oppressed whose significance rivals Gandhi and Nehru, though his legacy has been systematically marginalised.

Accessible, authoritative, and deeply sympathetic, this remains one of the best introductions to Ambedkar's thought for readers approaching him for the first time.`,
  },
  {
    id: 'omvedt-reinventing-revolution-1993',
    title: 'Reinventing Revolution: New Social Movements and the Socialist Tradition in India',
    author: 'Gail Omvedt',
    year: '1993',
    driveId: '1Ka7SCM1aJUSN1kez63sif1pRfHxdhoiT',
    description: `A major work of political sociology examining India's new social movements in relation to the socialist tradition. Omvedt analyses the anticaste movement, the women's movement, the farmers' movement (particularly the Shetkari Sanghatna), and the environmental movement as distinct but interconnected forces challenging both Brahmanical hierarchy and capitalist exploitation.

She argues that Indian socialism failed because it consistently subordinated the caste question to class, treating Dalit and women's liberation as secondary to a working-class revolution that never materialised. The new social movements, by contrast, put these questions first. Omvedt draws on her own fieldwork in rural Maharashtra and Tamil Nadu.

Published by M. E. Sharpe (1993). Essential for understanding the political landscape of post-Independence India and the relationship between caste, gender, and class in social movement theory.`,
  },
  {
    id: 'omvedt-violence-against-women-1990',
    title: 'Violence Against Women: New Movements and New Theories in India',
    author: 'Gail Omvedt',
    year: '1990',
    driveId: '1KCjGlZQJD5KFuG32xMOlQRlPn2DPHOky',
    description: `A pioneering analysis of violence against women in India that insists on the intersection of caste and gender. Written when the women's movement was grappling with the epidemic of dowry deaths, rising rape cases (Mathura, Maya Tyagi, Rameeza Bi), and sati, Omvedt critiques both traditional Marxist frameworks (which reduce violence to property relations) and Western radical feminism (which posits universal patriarchy).

She argues that in India, violence against women cannot be understood without caste — the specific forms of violence Dalit women face, the role of the Brahmanical order in controlling women's bodies, and the connections between upper-caste ritual purity norms and physical violence. Drawing on movements like the Shetkari Mahila Aghadi, she also traces the emergence of new feminist theory from within the movements themselves.

Published by Kali for Women (1990). One of the first rigorous feminist analyses to put Dalit women at the centre.`,
  },
  {
    id: 'omvedt-land-caste-politics-1982',
    title: 'Land, Caste and Politics in Indian States',
    author: 'Gail Omvedt (ed.)',
    year: '1982',
    driveId: '1KO5Z6fL8F55bHPKVcrNtpTsuK95ubtc3',
    description: `An edited collection that examines the relationship between land, caste, and political power across different Indian states — Orissa, Uttar Pradesh, West Bengal, Bihar, Punjab, Gujarat, and Andhra Pradesh. Contributors include Partha Chatterjee, Ghanshyam Shah, and other leading social scientists.

Omvedt's introductory essay, "Class, Caste and Land in India," argues against both the purely class-based and purely caste-based analyses that dominated Indian social science at the time. She develops a framework for understanding how agrarian class structure and caste hierarchy are mutually constitutive — neither reducible to the other, but always articulated together.

Published by Authors Guild Publications (1982). A foundational text in the political economy of caste in India.`,
  },
];

// ── Collection 2: Dalit Memoirs & Testimony ───────────────────────────────────

const MEMOIRS: TextSpec[] = [
  {
    id: 'moon-growing-up-untouchable',
    title: 'Growing Up Untouchable in India: A Dalit Autobiography',
    author: 'Vasant Moon',
    year: '1995',
    driveId: '1sWtzHXeST7OBR9-T9Ym9SB7bYLo86EP8',
    description: `Vasant Moon's memoir of growing up in the Mahar quarter of Nagpur, in a community shaped by the teachings and presence of Ambedkar. Moon, who became a distinguished Ambedkar scholar and edited the official Writings and Speeches, writes with extraordinary clarity about what it meant to come of age as an untouchable in mid-20th century India — the material poverty, the ritual humiliations, the hunger for education, and the gradual awakening of political consciousness.

The memoir is also a portrait of a community in transformation — the moment when Ambedkar's message of education, organisation, and agitation began to change how Mahars understood themselves and their place in the world. Moon documents the 1956 conversion ceremony, which he witnessed as a young man, with the vividness of lived experience.

Translated from Marathi by Wandana Sonalkar. Published by Rowman & Littlefield. One of the most important Dalit memoirs in English translation.`,
  },
  {
    id: 'pawar-weave-of-my-life',
    title: 'The Weave of My Life: A Dalit Woman\'s Memoirs',
    author: 'Urmila Pawar',
    year: '2008',
    driveId: '1fN4zkn1oJxGUc6ypWDq94Z7gP2K7tHWc',
    description: `Urmila Pawar's memoir — originally published in Marathi as "Aaydan" (The Weave) in 2003 — is one of the great autobiographical works in Indian literature. A Dalit woman from the Mahar community of the Konkan coast, Pawar writes about poverty, untouchability, domestic violence, and her gradual emergence as a writer and activist in the Dalit literary movement.

The title refers to the baskets her mother wove to sell — the "aaydan" that kept the family alive — and also to the woven texture of memory, community, and resistance. Pawar writes with rare honesty about the double oppression of being Dalit and a woman, the indignities within the Dalit community itself, and the particular silencing that women writers faced in the male-dominated Dalit literary scene.

Translated into English by Maya Pandit. Published by Columbia University Press (2008). Winner of the Sahitya Akademi award. Essential reading for understanding the intersection of caste and gender in lived experience.`,
  },
  {
    id: 'kamble-prisons-we-broke',
    title: 'The Prisons We Broke',
    author: 'Baby Kamble',
    year: '2008',
    driveId: '1dOD8aq-GrGAHX0PYvPtlrMGtCT5ue3V_',
    description: `Originally written in Marathi in 1986 as "Jina Amucha" (Our Lives), Baby Kamble's memoir is among the earliest — and most raw — accounts of Dalit women's experience in rural Maharashtra. Kamble grew up in the Mahar community of a village in Satara district and writes about the degradations of untouchability with the directness of someone who lived them: the prohibition on using public wells, the obligation to remove dead animals, the arbitrary violence of upper-caste landlords, the exclusion from temples and schools.

She also writes about the transformation that Ambedkar's movement brought — the moment when Dalit women began to refuse these arrangements, to assert their right to education, to stop performing degrading ritual labour. The book is explicitly feminist and Ambedkarite, placing the liberation of Dalit women at the centre of the democratic revolution.

Translated by Maya Pandit. Published by Orient Blackswan (2008). A landmark of Dalit women's literature.`,
  },
  {
    id: 'dutt-coming-out-as-dalit',
    title: 'Coming Out as Dalit',
    author: 'Yashica Dutt',
    year: '2019',
    driveId: '1dG1j78CukHF5OP9iundFM3wDaDWEVEgp',
    description: `Yashica Dutt's memoir begins with a secret she kept for years: that she was Dalit. A journalist at a leading Indian newspaper, she had learned — as many Dalits do — to conceal her identity in elite social and professional spaces where caste discrimination was polite, invisible, and relentless.

The book traces her childhood in Ajmer, the careful management of caste identity that her mother taught her, her education in Delhi's English-medium world, and the moment she decided to publicly claim her Dalitness. It is also an account of what it means to be Dalit in contemporary urban India — not the village untouchability of an earlier era, but the glass ceilings, social exclusions, and microaggressions of a "modern" meritocracy that is anything but.

One of the most important Dalit memoirs of the 21st century. Direct, angry, and lucidly argued. Published by Zuban (2019).`,
  },
  {
    id: 'gidla-ants-among-elephants',
    title: 'Ants Among Elephants: An Untouchable Family and the Making of Modern India',
    author: 'Sujatha Gidla',
    year: '2017',
    driveId: '1dLxU5dK9soIVa4VjDp4semtD101rElmO',
    description: `Sujatha Gidla's family history spans the transformation of Andhra Pradesh from the 1930s to the 1990s — from the feudal Nizam's dominions through Indian independence to the Naxalite movement. Gidla, now a subway conductor in New York, tells the story of her mother's family: Marthamma, a Christian Dalit from the Mala caste, and her uncle K. G. Satyamurthy, who became one of the founders of the Naxalite movement in Andhra and spent years in prison.

The book is extraordinary for its refusal of sentimentality. Gidla writes about untouchability with cold clarity, showing its mechanisms of humiliation in precise detail. She also writes about the contradictions of the Naxalite movement — which proclaimed liberation for the oppressed while reproducing caste hierarchy within its own ranks.

Published by Farrar, Straus and Giroux (2017). Winner of the PEN Open Book Award. One of the best English-language books on caste written in recent decades.`,
  },
  {
    id: 'pawar-dalit-panthers-authoritative-history',
    title: 'Dalit Panthers: An Authoritative History',
    author: 'J. V. Pawar',
    year: '2017',
    driveId: '1whdroJPok73YrXiYDIWLgoBXZiuV0Gpj',
    description: `J. V. Pawar was a founding member of the Dalit Panthers, the radical Dalit political organisation founded in Bombay in 1972 by Namdeo Dhasal, Raja Dhale, and others inspired by the Black Panthers of the United States. This authoritative history — the fullest account written by an insider — documents the movement's founding, its extraordinary creative energy, its internal conflicts, and its eventual fragmentation.

The Dalit Panthers produced some of the most powerful political literature in Marathi — the poetry of Dhasal, the journalism of Dhale — while also organising young Dalit men in Bombay's working-class chawls to resist caste violence. Their manifesto, which explicitly linked Dalit oppression to global structures of race and class, was a watershed in Dalit political thought.

Translated from Marathi and published by Forward Press (2017). Essential for understanding Dalit political radicalism in the 1970s.`,
  },
  {
    id: 'swamy-not-silent-spectator',
    title: 'I Am Not a Silent Spectator',
    author: 'Stan Swamy',
    year: '2021',
    driveId: '1KBUWsE_d9ph2HiP4bnY54LlGnV6ICku5',
    description: `Stan Swamy (1937–2021), a Jesuit priest who spent decades working with Adivasi communities in Jharkhand, died in judicial custody in July 2021 — the oldest person arrested under India's draconian UAPA law. He was 83, suffering from Parkinson's disease, and had spent the last months of his life fighting for the simple right to use a straw and sipper while awaiting trial.

This collection gathers his writings, letters, and testimonies — including his reflections from prison and his accounts of the struggles of Jharkhand's tribal communities against dispossession by mining corporations and state violence. Swamy wrote with the clarity of someone who had nothing left to conceal: his work was an indictment of the Indian state's treatment of its most marginalised citizens.

A martyr of the democratic movement, his life and death represent the most direct intersection of faith, caste, and political repression in contemporary India.`,
  },
  {
    id: 'rapt-in-the-name-ramnamis',
    title: 'Rapt in the Name: The Ramnamis, Ramnam, and Untouchable Religion in Central India',
    author: 'Ramdas Lamb',
    year: '2002',
    driveId: '1u6xEBCpk_B3hUOKy7ntR5mtT99DwXlgJ',
    description: `The Ramnamis are a movement among Dalit communities in Chhattisgarh who began, in the late 19th century, to tattoo the name "Ram" across their bodies — including their foreheads, tongues, and the soles of their feet. This was simultaneously a devotional act and a radical assertion: upper-caste Hindus had banned Dalits from using the name of Ram and from entering temples. The Ramnamis made their bodies into temples.

Ramdas Lamb's ethnographic study of the movement — based on years of fieldwork — examines the Ramnamis as a form of subaltern religion that simultaneously appropriates and subverts the dominant tradition. Their use of Ram is not the Ram of Hindutva but a formless, casteless divinity — close in spirit to the bhakti tradition of Ravidas and Kabir.

Published by SUNY Press. A rare and important study of religious creativity in Dalit communities, showing how "religion" can be a weapon of the oppressed as much as an instrument of their oppression.`,
  },
];

// ── Collection 3: Dalit Literature & Cultural Criticism ───────────────────────

const DALIT_LITERATURE: TextSpec[] = [
  {
    id: 'abraham-dalit-literatures-india',
    title: 'Dalit Literatures in India',
    author: 'Joshil K. Abraham & Judith Misrahi-Barak (eds.)',
    year: '2015',
    driveId: '1w7taOFjEK1ZmboF_uT9hLiQM3TKFmJv1',
    description: `A comprehensive survey of Dalit literary traditions across Indian languages — Marathi, Tamil, Telugu, Hindi, Kannada, Malayalam, Bengali, and more. The editors bring together essays by leading scholars to map a literary movement that is simultaneously diverse and unified: diverse in language, tradition, and regional history; unified in its opposition to caste and its insistence on the humanity of those the system has degraded.

The volume challenges the standard periodisation of Indian literary history, which has either ignored Dalit writing entirely or treated it as a peripheral phenomenon. The contributors argue that Dalit literature is not a regional or genre curiosity but a major strand of Indian modernity — one that preceded and shaped much of what is called postcolonial literature.

Published by Routledge (2015). An essential reference work for scholars and students of Indian literature.`,
  },
  {
    id: 'satyanarayana-exercise-of-freedom',
    title: 'The Exercise of Freedom: An Introduction to Dalit Writing',
    author: 'K. Satyanarayana',
    year: '2013',
    driveId: '1vxFCZ-osz_jCj2yPBzuFQFUe2B8SJcEK',
    description: `An introduction to Dalit writing in English and in English translation, situating it in the broader landscape of global subaltern literature. Satyanarayana traces the emergence of Dalit autobiography, poetry, fiction, and journalism across different Indian languages, paying particular attention to the political conditions that enabled writers to claim authorship and audience.

He argues that Dalit writing represents a "new literary public sphere" — one that is constituted by and for those who were historically excluded from cultural production. The "exercise of freedom" of the title refers to Ambedkar's constitutional framework: the freedoms that Dalit writers enact in the act of writing itself.

Published by Navayana (2013). A good entry point for readers new to Dalit literature.`,
  },
  {
    id: 'spotted-goddesses-dalit-women',
    title: 'Spotted Goddesses: Dalit Women\'s Agency Narratives on Caste and Gender',
    author: 'Meena Gopal (ed.)',
    year: '2013',
    driveId: '1tsxDA-YquefonJ2LsY6K3Fy1z_RSRTm8',
    description: `A collection of narratives, testimonies, and analytical essays on Dalit women's experience of intersecting caste and gender oppression. The "spotted goddesses" of the title refers to goddesses in regional folk traditions who, unlike Sanskritic deities, bear marks of their own — untidy, specific, unabstracted from history.

The volume brings together social scientists, activists, and writers to examine how Dalit women have articulated their own experience in conditions where neither the mainstream women's movement nor the Dalit movement fully acknowledged their specific position. It engages with debates in feminist and subaltern theory while remaining grounded in lived experience.

An important contribution to the scholarship on intersectionality in the Indian context.`,
  },
  {
    id: 'women-heroes-dalit-assertion',
    title: 'Women Heroes and Dalit Assertion in North India: Culture, Identity and Politics',
    author: 'Badri Narayan',
    year: '2006',
    driveId: '1ttF079lkY0PvrMy9sZmp2EprSDhQc4wR',
    description: `Badri Narayan's study of how Dalit communities in Uttar Pradesh and Bihar have used women heroes — both historical and legendary figures — as symbols of political assertion and identity-building. Drawing on fieldwork among Chamar, Pasi, and other Dalit communities, he examines how stories of women like Uda Devi (who shot British officers from a tree during the 1857 uprising) have been recovered, reinvented, and mobilised in the service of Dalit politics.

The book is particularly valuable for understanding the cultural dimensions of Dalit political assertion in the Hindi heartland — a region with very different traditions from Maharashtra, which has dominated the academic study of Dalit politics. Narayan shows how myth, memory, and history are political resources.

Published by SAGE (2006). Important reading for understanding Dalit politics beyond the Ambedkar-Maharashtra axis.`,
  },
  {
    id: 'cultural-study-dalit-autobiographies',
    title: 'A Cultural Study of Dalit Autobiographies',
    author: 'Pramod K. Nayar',
    year: '2020',
    driveId: '1J7gsjedXkS_POcAPgUZn5wWUi5QZlvmr',
    description: `A scholarly analysis of Dalit autobiography as a genre — examining what it means for a person from a community denied subjecthood to claim the form of life-writing that presupposes an autonomous, narrating self. Nayar engages with postcolonial theory, disability studies, and affect theory to read Dalit autobiographies not merely as sociological documents but as literary and political interventions.

He examines texts by Daya Pawar, Om Prakash Valmiki, P. Sivakami, Urmila Pawar, and others, asking what narrative strategies Dalit writers deploy and what they reveal about the specific texture of caste oppression — its bodily dimensions, its psychic costs, its temporal structures.

A rigorous contribution to both Dalit studies and literary theory.`,
  },
  {
    id: 'gujarati-dalit-writings-survey',
    title: 'Gujarati Dalit Writings: A Survey',
    author: 'Dalpat Chauhan',
    year: '2010',
    driveId: '1mx8PkhtqAcPZF1UCz2GhLHGWFQOJn8fv',
    description: `A survey of Dalit literature in Gujarati — a tradition less studied in English than Marathi or Tamil Dalit writing but with its own long history of resistance. Chauhan maps the poetry, fiction, autobiography, and journalism that emerged from Vankars, Chamars, and other Dalit communities in Gujarat, paying particular attention to the relationship between caste and the communal violence that has marked Gujarati political life.

The survey is particularly valuable for its documentation of lesser-known writers and forms, recovering voices from a tradition that has often been overlooked even in broader Dalit studies.`,
  },
];

// ── Collection 4: Caste Studies & Scholarship ────────────────────────────────

const CASTE_STUDIES: TextSpec[] = [
  {
    id: 'rao-caste-question-2009',
    title: 'The Caste Question: Dalits and the Politics of Modern India',
    author: 'Anupama Rao',
    year: '2009',
    driveId: '1sI1r134y8skaRv0-O20Q6RsWqbFp3N-6',
    description: `Anupama Rao's major work on the transformation of caste in the making of modern India. She examines the period from colonial rule through the constitutional moment (1947–1950) to the Mandal Commission controversies of the 1990s, asking how Dalits became political subjects and how the Indian state has attempted to manage — rather than eliminate — caste.

Rao focuses on the concept of "untouchability" itself — how it was defined, contested, criminalised, and perpetuated under both colonial and postcolonial law. She argues that the state's anti-discrimination framework has paradoxically preserved caste as a legal category while failing to address caste as a lived structure of domination.

Published by University of California Press (2009). Essential scholarship for understanding the political sociology of caste in independent India.`,
  },
  {
    id: 'galanter-competing-inequalities',
    title: 'Competing Equalities: Law and the Backward Classes in India',
    author: 'Marc Galanter',
    year: '1984',
    driveId: '1vieQrGuWVtRHlH_AOynMy81_WJpH1Xlz',
    description: `Marc Galanter's comprehensive legal and sociological study of India's compensatory discrimination policies — reservations in government employment and educational institutions for Scheduled Castes, Scheduled Tribes, and other backward classes. Written by an American legal scholar who spent decades studying Indian law, this remains the most rigorous analysis of the constitutional and administrative framework of reservations.

Galanter traces the origins of preferential policies under colonial rule, their embedding in the Constitution, the successive judicial interpretations, and the sociological evidence for their effects. He is sympathetic to the Dalit position while scrupulous about empirical evidence.

Published by Oxford University Press (1984). The standard academic reference on reservations policy.`,
  },
  {
    id: 'shah-untouchability-rural-india',
    title: 'Untouchability in Rural India',
    author: 'Ghanshyam Shah et al.',
    year: '2006',
    driveId: '1vZVfwv-NA3EqNeJ8RaH10Ny_EVg80MY8',
    description: `A landmark empirical study of the persistence of untouchability in rural India, based on surveys conducted in 565 villages across 11 states. The researchers document the specific practices — denial of access to wells, temples, barber shops, tea stalls; exclusion from cremation grounds; enforcement of "separate seating" in schools; prohibition on inter-caste marriage — that constitute untouchability in contemporary rural life.

The findings demolished the conventional wisdom that untouchability had been largely eliminated by the Untouchability (Offences) Act of 1955 and subsequent legislation. In most villages surveyed, most forms of untouchability remained in force, with Dalit families facing the daily negotiation of caste hierarchy as a fact of life.

Published by SAGE (2006). One of the most important empirical studies of caste in independent India.`,
  },
  {
    id: 'dalits-neoliberal-india',
    title: 'Dalits in Neoliberal India: Mobility or Marginalisation?',
    author: 'Clarinda Still (ed.)',
    year: '2014',
    driveId: '1vPpMXShsGrDY3N4uyHOXFhxae9RafTSn',
    description: `An interdisciplinary collection examining what liberalisation has meant for Dalit communities since 1991. The contributors — sociologists, economists, anthropologists — examine the debate between those who argue that market liberalisation has created new opportunities for Dalits by breaking the caste monopoly on economic life, and those who argue that liberalisation has deepened inequality while dismantling the affirmative action framework.

Drawing on fieldwork from across India, the essays examine Dalit entry into new economic sectors (IT, business), the fate of government employment (the traditional avenue of Dalit mobility), the politics of Dalit capitalism, and the persistence of caste discrimination in the "modern" economy.

Published by Routledge (2014). Essential for understanding Dalit experience in contemporary India.`,
  },
  {
    id: 'yengde-caste-matters',
    title: 'Caste Matters',
    author: 'Suraj Yengde',
    year: '2019',
    driveId: '1dUZTMPmJhPZbt96PSBFqm8LLkCYWd6ZP',
    description: `Suraj Yengde's global analysis of caste — written by a young Dalit scholar who has moved between India, South Africa, the United Kingdom, and the United States. Yengde argues that caste is not simply an Indian problem but a global structure of hierarchy that intersects with race, class, and gender in different configurations around the world.

He introduces the concept of "Global Dalits" — communities across South Asia, Africa, Japan (the Burakumin), and the diaspora who share structural positions analogous to Dalits in India. He also offers a frank account of the psychic life of caste — the internalised humiliation, the negotiation of identity in elite spaces, the relationship between Dalit politics and academic scholarship.

Published by PENGUIN (2019). One of the most widely read works of contemporary Dalit scholarship.`,
  },
  {
    id: 'ilaiah-buffalo-nationalism',
    title: 'Buffalo Nationalism: A Critique of Spiritual Fascism',
    author: 'Kancha Ilaiah Shepherd',
    year: '2004',
    driveId: '1s_umUxva_aU5yoxkCj3Xnr8B-KyjIxIh',
    description: `A collection of provocative essays by one of India's most controversial public intellectuals. Ilaiah uses the buffalo — the animal central to Dalit and OBC productive life but associated with death, impurity, and Yama (the god of death) in upper-caste cosmology — as a symbol of the culture that Hindutva nationalism has always despised and sought to destroy.

The essays attack the Brahmanical cultural nationalism of the RSS/BJP, arguing that "spiritual fascism" — the imposition of a Brahminical Hindu identity on a diverse society — is the Indian variant of European fascism. He also critiques Gandhi and the Congress tradition for their failure to challenge caste.

Kancha Ilaiah Shepherd grew up in a shepherd community (Kuruma) in Andhra Pradesh and writes with the visceral knowledge of someone from a "productive caste" — those who labour with animals and soil and whose lives Brahminism has always stigmatised.`,
  },
  {
    id: 'ilaiah-the-shudra',
    title: 'The Shudra: Vision for a New Path',
    author: 'Kancha Ilaiah Shepherd',
    year: '2021',
    driveId: '1saTdFgMrb2MBjrh1rZCVLdUmejNgpM4l',
    description: `Ilaiah's analysis of the Shudra varna — the agrarian and artisan communities who constitute the vast majority of India's population but whose intellectual and spiritual traditions have been systematically suppressed. Engaging with Ambedkar's "Who Were the Shudras?", he argues for a new political identity for the Shudra-OBC communities that is distinct from both Brahminism and Dalit Ambedkarism.

The book proposes a "Shudra liberation" project — the cultural and political assertion of the productive castes as a class with their own history, philosophy, and civilisational values, in opposition to the parasitic Brahmanical order. Ilaiah draws on folk traditions, oral histories, and his own community experience.

One of Ilaiah's most developed theoretical works, engaging seriously with Ambedkar while also departing from the Navayana framework.`,
  },
  {
    id: 'ilaiah-post-hindu-india',
    title: 'Post-Hindu India: A Discourse in Dalit-Bahujan, Socio-Spiritual and Scientific Revolution',
    author: 'Kancha Ilaiah Shepherd',
    year: '2009',
    driveId: '1x5F0uM33AfPcsACvy_cRkk_qB_eq8iiZ',
    description: `Ilaiah's most systematic theoretical work, imagining an India after Brahmanical Hinduism — a "post-Hindu India" in which the productive castes (Dalits, OBCs, Adivasis) have reclaimed their history, their spirituality, and their political power. The "post-Hindu" is not secular but spiritually diverse — drawing on Buddhist, Shaivite, and animist traditions that predate and contest Brahmanical Hinduism.

The book is organised around a critique of "spiritual fascism" and a positive vision of the socio-spiritual revolution that Ambedkar, Phule, and Periyar began. Ilaiah imagines what Indian education, culture, science, and democracy would look like if they were built on the foundation of productive-caste values rather than Brahmanical ones.

Published by SAGE (2009). Ilaiah's most ambitious work.`,
  },
  {
    id: 'gudavarthy-dalit-naxalite-ap',
    title: 'Dalit and Naxalite Movements in Andhra Pradesh: Contradictions, Co-optation, and Resistance',
    author: 'Ajay Gudavarthy',
    year: '2008',
    driveId: '1sHj33x67L9ZM0fsrj52O650mTT2_9SoN',
    description: `Gudavarthy examines the complex relationship between the Maoist-Naxalite movement and Dalit communities in Andhra Pradesh — a region where both movements have been particularly strong and where their interaction has produced both solidarity and violent conflict.

He argues that the Naxalite movement, for all its rhetorical commitment to Dalit liberation, has reproduced caste hierarchy within its own structures and has often imposed a class framework that erases the specific dimensions of caste oppression. At the same time, Dalit communities have sometimes used Naxalite support as a resource against upper-caste landlord violence.

The book raises fundamental questions about the relationship between socialist and Ambedkarite politics — questions that remain unresolved in Indian progressive movements.`,
  },
  {
    id: 'spivak-can-subaltern-speak',
    title: 'Can the Subaltern Speak?',
    author: 'Gayatri Chakravorty Spivak',
    year: '1988',
    driveId: '1KtlsNWtjEDJt2R4wabxBShq41uhfOZPA',
    description: `Spivak's canonical essay — originally published in 1988 and revised in later editions — is the founding text of subaltern studies in its deconstruction of the very possibility of subaltern speech within Western intellectual frameworks. Drawing on Derrida, Marx, and Foucault, she argues that the subaltern cannot speak — not because they lack speech, but because the conditions of intelligibility are structured so that their speech cannot be heard as speech.

Her central case is the sati (widow immolation) debate: the colonial British said "we must stop the Hindus from burning women alive"; upper-caste Hindu nationalists said "women want to die on their husbands' funeral pyres." In neither case, Spivak argues, can the widow speak.

Indispensable for understanding the theoretical debates in subaltern studies and postcolonial theory. Also the most contested text in the field — read alongside responses from Ranajit Guha, Partha Chatterjee, and Dalit feminist critics who argue that Spivak's framework itself erases Dalit women's agency.`,
  },
  {
    id: 'reading-periyar-today',
    title: 'Reading Periyar Today',
    author: 'M. S. S. Pandian & others',
    year: '2007',
    driveId: '1xHtARTcgvjD6g1I83Bo4v9h0qe9JzhEr',
    description: `A collection of essays reassessing the legacy of E. V. Ramasamy Periyar (1879–1973) — the Tamil social reformer who founded the Self-Respect Movement and spent six decades attacking Brahminism, religion, and the Congress party. The contributors examine Periyar's thought through contemporary lenses: feminism, secularism, Dalit studies, and comparative political theory.

Periyar remains one of the most radical figures in Indian political history — an atheist who burned images of gods to protest their use in legitimating caste, who performed inter-caste and widow marriages decades before they were legal, who argued that "rationalism" was the only basis for human dignity.

Essential for understanding the Tamil anti-caste tradition and its relationship to the broader pan-Indian Dalit movement.`,
  },
  {
    id: 'rawls-and-dhasal',
    title: 'Rawls and Dhasal: Justice and Dalit Poetry',
    author: 'Various',
    year: '2010',
    driveId: '1xI_E9v51jHvxEkubkZExjvRwekGNT9kY',
    description: `A philosophical dialogue between John Rawls's theory of justice and the poetry of Namdeo Dhasal — co-founder of the Dalit Panthers and the most powerful voice in Marathi Dalit poetry. The collection asks what Western liberal political philosophy looks like when read from the perspective of those for whom the "original position" has always already been determined by caste. Dhasal's poetry — explicit, furious, and formally innovative — puts pressure on Rawls's abstractions in ways that no academic philosophy can.`,
  },
  {
    id: 'humiliation-claims-context',
    title: 'Humiliation: Claims and Context',
    author: 'Gopal Guru (ed.)',
    year: '2009',
    driveId: '1j1Gxb17v4Fu09q3GJEPaMNdtk-RwyhAp',
    description: `A philosophical and sociological examination of humiliation as a category — with particular attention to caste humiliation as a structural feature of Indian society rather than an individual moral failing. Contributors examine the experience of humiliation from multiple angles: its phenomenology, its relationship to dignity and recognition, its political uses, and its role in the formation of Dalit political consciousness. Gopal Guru's introduction is a major contribution to the philosophy of caste.`,
  },
  {
    id: 'ponniah-caste-queer-identities',
    title: 'Caste-ing Queer Identities: Dalit LGBTQ+ Experience',
    author: 'Ponniah & Tamalapakula',
    year: '2013',
    driveId: '1slU8cw6kqafnGhvzIsfZ4_f3haAG4z-o',
    description: `An examination of the intersection of caste and sexual identity in India — asking what it means to be both Dalit and queer in a society where caste and heteronormative family structure are deeply entangled. The authors argue that mainstream LGBTQ+ movements in India have been dominated by upper-caste perspectives and have failed to address how caste shapes queer experience. Conversely, Dalit politics has been largely silent on sexuality. This essay opens a conversation between these two silences.`,
  },
  {
    id: 'caste-disability-policy-paper',
    title: 'Caste and Disability: Policy Analysis',
    author: 'Various',
    year: '2019',
    driveId: '1qJvX_Ue_ltLPn3kqi3tIHr-q3nVFGB06',
    description: `A policy paper on the intersection of caste and disability in India — examining how Dalit persons with disabilities face compounded disadvantage, and how disability policy has failed to account for the caste dimensions of access, stigma, and exclusion. The paper makes policy recommendations for an intersectional approach to disability rights and affirmative action.`,
  },
  {
    id: 'dalit-technology-divide',
    title: 'Dalit and the Technology Divide',
    author: 'Various',
    year: '2012',
    driveId: '1lfpFq_lEXnGFA7BlacoVh917Gu9Lsd4L',
    description: `An analysis of how the "digital divide" in India maps onto caste hierarchy — how Dalit communities have been systematically excluded from the technology sector's growth, both as workers and as beneficiaries. The report examines the upper-caste dominance of the IT industry, the barriers facing Dalit students in technical education, and the potential for digital tools to either reinforce or challenge caste-based discrimination.`,
  },
  {
    id: 'ambedkar-neo-buddhist-movement',
    title: 'Ambedkar and the Neo-Buddhist Movement',
    author: 'Owen M. Lynch',
    year: '1969',
    driveId: '1vIa6FOuvVlM2vx-9N1FlN_JneSeyD_9R',
    description: `A sociological study of the Buddhist conversion movement that Ambedkar launched in 1956, examining how the movement developed among Mahar communities in Maharashtra in the years immediately following the conversion. Lynch examines the organisational structure of the movement, the role of religious practice in sustaining Dalit solidarity, and the relationship between Buddhist identity and political action.

Written by an American anthropologist who conducted fieldwork in Maharashtra in the late 1960s, this is one of the earliest systematic studies of what became the Ambedkarite Buddhist community.`,
  },
  {
    id: 'politics-identity-writing',
    title: 'Politics of Identity and the Project of Writing',
    author: 'Various',
    year: '2007',
    driveId: '1uKukmG1T2Ql3JeHmq_vZD4FocpbFeqVQ',
    description: `A collection exploring the relationship between political identity — particularly Dalit and subaltern identity — and the act of writing. Contributors examine how Dalit writers have negotiated the tension between writing as a political act of assertion and writing as an aesthetic practice, between testimonial and literary modes, between collective political voice and individual authorship.`,
  },
  {
    id: 'soneji-unfinished-gestures',
    title: 'Unfinished Gestures: Devadasis, Memory, and Modernity in South India',
    author: 'Davesh Soneji',
    year: '2012',
    driveId: '1vrX4dAzEW5Amv2LNXpKJwwXVJB_33v6d',
    description: `An ethnographic and historical study of the devadasi tradition in South India — women dedicated to temples who were also performers of classical music and dance. Soneji examines how colonial and nationalist reformers constructed the devadasi as a "prostitute" to be rescued, while erasing the artistic and religious dimensions of her practice. He draws on oral history interviews with former devadasis and their descendants, recovering a perspective largely absent from official histories of Indian classical arts.`,
  },
];

// ── Collection 5: Ambedkar — Historical and Political Writings ─────────────────

const AMBEDKAR_HISTORICAL: TextSpec[] = [
  {
    id: 'ambedkar-chamcha-age-1969',
    title: 'The Chamcha Age: An Era of the Stooges',
    author: 'B. R. Ambedkar',
    year: '1969',
    driveId: '1tYRG1BhKFwZOZ3xCtQ3f0arv8AACD_M-',
    description: `Written in 1945, "The Chamcha Age" (Age of Stooges) is Ambedkar's most polemical attack on the Congress Party and on Dalit leaders who aligned with it. "Chamcha" — literally a spoon, figuratively a sycophant — was Ambedkar's term for Dalit politicians who accepted Congress patronage in exchange for abandoning the independent Dalit political position.

Ambedkar argued that the Congress's practice of fielding Dalit candidates from constituencies where Dalit votes were decisive — but selecting candidates loyal to the Congress rather than to Dalit interests — was a mechanism for neutralising Dalit political power while appearing to include them. The "chamcha" became a standard concept in Ambedkarite political vocabulary.

The text remains relevant to debates about representation, tokenism, and political co-optation of marginalised communities.`,
  },
  {
    id: 'ambedkar-ranade-gandhi-jinnah',
    title: 'Ranade, Gandhi and Jinnah',
    author: 'B. R. Ambedkar',
    year: '1943',
    driveId: '1x5fZzlQ6pFevdOhbcMoJX-jCyJwf4nJu',
    description: `A lecture delivered by Ambedkar on the 101st birthday of Mahadev Govind Ranade, the 19th-century Maharashtra reformer. In it, Ambedkar compares three political traditions: Ranade's social reform liberalism (which insisted that political freedom required social reform), Gandhi's conservatism (which defended varna in modified form while refusing to challenge caste), and Jinnah's Muslim League nationalism.

Ambedkar uses the comparison to argue for the primacy of social reform — his consistent position from his earliest writings. He is sharply critical of Gandhi for opposing Ranade's tradition and for bringing religious conservatism into politics under the guise of spirituality.

One of the most concise and accessible of Ambedkar's political writings.`,
  },
  {
    id: 'ambedkar-bbc-poona-pact-1955',
    title: 'B. R. Ambedkar Speaks on M. K. Gandhi and the Poona Pact (BBC Radio, 1955)',
    author: 'B. R. Ambedkar',
    year: '1955',
    driveId: '1OoM0j13w7ABiz-hpQrkdI8iv_wtTG9oYi',
    archiveIds: ['ambedkar-bbc-1955', 'ambedkar-bbc-poona-pact'],
    description: `A transcript of Ambedkar's interview with BBC radio in 1955 — one year before his death — in which he discusses the Poona Pact of 1932. The Pact was signed under duress: Gandhi had gone on a fast-unto-death to prevent separate electorates for Untouchables (which Ambedkar had won at the Round Table Conference), and Ambedkar signed away the separate electorates to save Gandhi's life.

Ambedkar describes this as the greatest blow to Dalit political power in the 20th century. Separate electorates would have guaranteed Dalit communities autonomous political representation, independent of Congress and caste-Hindu voters. The Pact replaced them with a system of reserved seats in joint electorates — which has meant, Ambedkar argues, that Dalits have never been able to elect candidates who truly represent them.

The BBC interview is among the last records of Ambedkar's voice and represents his most candid public statement on Gandhi's role.`,
  },
  {
    id: 'dalit-panthers-manifesto-1972',
    title: 'Dalit Panthers Manifesto (1972)',
    author: 'Dalit Panthers',
    year: '1972',
    driveId: '1CPSSEZRt2CmUzT0UD-PXMPIk8TGOIYl1',
    archiveIds: ['dalit-panthers-manifesto', 'dalitpanthersmanifesto1972'],
    description: `The founding document of the Dalit Panthers — issued in Bombay in 1972 by Namdeo Dhasal, Raja Dhale, J. V. Pawar, and others who drew explicit inspiration from the Black Panthers of the United States. The manifesto defined "Dalit" broadly: "Members of scheduled castes and tribes, neo-Buddhists, the working people, the landless and poor peasants, women and all those who are being exploited politically, economically and in the name of religion."

The manifesto was a watershed in Dalit political thought. It placed Dalit oppression in the context of global capitalism and racial hierarchy, drew on Marxist and Ambedkarite frameworks simultaneously, and announced a confrontational politics very different from the constitutional path Ambedkar had emphasised.

Short but historically significant — the document that launched the most important Dalit political movement of the post-independence period.`,
  },
  {
    id: 'ambedkar-baws-vol17',
    title: 'Dr. Babasaheb Ambedkar: Writings and Speeches, Volume 17',
    author: 'B. R. Ambedkar',
    year: '2003',
    driveId: '1n-C3W-F_-FqeAMizxWf7K9QPOJjlIw7f',
    description: `Volume 17 of the official Dr. Babasaheb Ambedkar: Writings and Speeches series, published by the Government of Maharashtra. This volume contains later writings and speeches not included in earlier volumes, including material on the Constitution, on Buddhism, and on the condition of Dalits in the years immediately following independence.

The BAWS series is the definitive collection of Ambedkar's works in English. Volume 17 was compiled posthumously from manuscripts, notes, and transcripts. Essential for researchers working on Ambedkar's thought.`,
  },
];

// ── Collection 6: Phule & Savitribai ─────────────────────────────────────────

const PHULE_SAVITRIBAI: TextSpec[] = [
  {
    id: 'narake-savitribai-phule',
    title: 'Dnyanjyoti Savitribai Phule: Complete Works',
    author: 'Hari Narake (ed.)',
    year: '2007',
    driveId: '1siSZWdqTeikFYqLeU6CGj-VU_W0LwEAO',
    description: `A scholarly edition of the complete works of Savitribai Phule (1831–1897) — poet, teacher, social reformer, and co-founder (with her husband Jyotirao Phule) of the first school for girls and Dalit children in India. Edited by Hari Narake, who spent decades recovering and editing the Maharashtra Satyashodhak tradition.

Savitribai Phule wrote poetry in Marathi that combined lyrical beauty with radical social content — poems about education, widow remarriage, caste discrimination, and women's liberation. She ran schools in the face of social ostracism and physical attacks. She established a home for rape survivors. During the plague epidemic of 1897, she personally nursed patients in the camps and died of plague herself.

This volume makes her complete works accessible for the first time to a wider audience. One of the most important documents in Indian women's history.`,
  },
  {
    id: 'phule-slavery-government-maharashtra',
    title: 'Jotiba Phule — Slavery (Gulamgiri)',
    author: 'Jyotirao Phule',
    year: '1873',
    driveId: '1dex4Os9Q_Z3845yB39aO86dsPe9Chu3l',
    archiveIds: ['gulamgiri00phul', 'gulamgiri1873phule'],
    description: `The Government of Maharashtra edition of Phule's Gulamgiri (Slavery, 1873) — the foundational text of the Indian anti-caste movement. Phule dedicated the book to the abolitionists of the United States, drawing an explicit parallel between African American slavery and the caste enslavement of Shudras and untouchables. He argued that Brahminism was a system of spiritual and material exploitation as brutal as American slavery but lacking even the honesty of naming itself as such. The Gulamgiri is the source of Phule's concept of "Bali Raja" — the original pre-Brahmin ruler of India, expelled by Aryan invaders, whose return the lower castes awaited. See also the hardcoded Gulamgiri text in the Navayana & Social Justice collection.`,
  },
];

// ── Collection 7: Ancient Indian History ─────────────────────────────────────

const ANCIENT_INDIA: TextSpec[] = [
  {
    id: 'jha-ancient-india-historical-outline',
    title: 'Ancient India in Historical Outline',
    author: 'D. N. Jha',
    year: '1998',
    driveId: '14EosrAu2mjjlV9CwLD65rzW-e1XKQgdg',
    description: `D. N. Jha's concise history of ancient India — written against the grain of the Hindutva-nationalist rewriting of Indian history that accelerated through the 1980s and 1990s. Jha, one of India's leading ancient historians, draws on archaeology, epigraphy, and textual analysis to present a secular, evidence-based account of India's ancient past.

He argues that ancient India was plural, dynamic, and in constant flux — not the eternal Hindu civilisation of nationalist mythology. He pays particular attention to the evidence for beef-eating in ancient India (the subject of his more controversial later work "The Myth of the Holy Cow"), to the materialist philosophical traditions (Lokayata/Charvaka), and to the social and economic basis of the Maurya and Gupta empires.

Published by Manohar. Essential reading for understanding the historical claims underlying both Hindutva nationalism and Ambedkarite counter-history.`,
  },
  {
    id: 'ancient-india-language-religions',
    title: 'Ancient India: Its Language and Religions',
    author: 'H. C. Raychaudhuri (ed.)',
    year: '1965',
    driveId: '1nPjcy3IUL-Dc4_N1G8oI8iv_wtTG9oYi',
    description: `A scholarly collection examining the linguistic and religious diversity of ancient India — the co-existence of Sanskrit with Prakrit, Pali, and Dravidian languages; the competition between Brahminism, Buddhism, Jainism, and Ajivika; the emergence of bhakti traditions. Important context for understanding the claims made by both Hindutva nationalism (India as eternally Hindu) and the Ambedkarite-Buddhist tradition (India as originally Buddhist, then counter-reformed by Brahminism).`,
  },
  {
    id: 'bhalchandra-namdev-pooja-pact',
    title: 'Battle for China\'s Past: Mao and the Cultural Revolution',
    author: 'Mobo Gao',
    year: '2008',
    driveId: '1sd_qm6boG7WhxShAvR2XVBl0c5Lo_epy',
    description: `Mobo Gao's revisionist account of the Cultural Revolution — arguing against the standard narrative of unmitigated disaster by recovering the perspectives of rural and working-class Chinese who experienced social mobility and genuine cultural empowerment during the period. Included here for comparative study of revolutionary movements, the relationship between liberation and violence, and the historiography of radical social change. Read alongside Dalit political history for insights into how subaltern experiences of revolutionary periods are erased from official memory.`,
  },
];

// ── Collection 8: Violence, Fascism, Communalism ─────────────────────────────

const VIOLENCE_FASCISM: TextSpec[] = [
  {
    id: 'pogrom-gujarat-hindu-nationalism',
    title: 'Pogrom in Gujarat: Hindu Nationalism and Anti-Muslim Violence in India',
    author: 'Parvis Ghassem-Fachandi',
    year: '2012',
    driveId: '1srbjfdrsvt_dcn7ykXmVF0pTjMX5YCwJ',
    description: `An anthropological study of the Gujarat pogrom of February–March 2002 in which approximately 2,000 Muslims were killed and 150,000 displaced in coordinated violence following the Godhra train burning. Ghassem-Fachandi, an anthropologist who was in Ahmedabad when the violence broke out, examines the culture of Hindu nationalism that made this violence possible — the vegetarianism ideology that marks non-vegetarians as polluting, the sexual anxiety about Muslim masculinity, and the organisational infrastructure of the RSS and VHP that enabled "spontaneous" violence to be coordinated across the state.

The book is essential reading for understanding how Hindu nationalism produces its violence — not as an aberration but as an expression of its deepest ideological commitments. It should be read alongside Ambedkar's analysis of Brahminism and alongside the history of anti-Dalit violence.`,
  },
  {
    id: 'fascism-a-warning',
    title: 'Fascism: A Warning',
    author: 'Madeleine Albright',
    year: '2018',
    driveId: '1sHM0Z-79g7oTvWHNowQAFBYpEVxScz5N',
    description: `Former US Secretary of State Madeleine Albright's comparative study of fascism — drawing on the 1930s European experience and arguing that the conditions for fascism are re-emerging in the early 21st century. Written from a liberal-democratic perspective, the book provides historical context for understanding how democratic institutions are eroded by authoritarian movements.

Included here as comparative reading alongside the Dalit literature on Brahminism as "spiritual fascism" (Kancha Ilaiah's term) and the analysis of Hindu nationalism. Albright's account of fascism's defining features — ultra-nationalism, the leader cult, the demonisation of minorities, the capture of state institutions — is legible in the Indian context.`,
  },
  {
    id: 'love-loss-longing-kashmir',
    title: 'Love, Loss, and Longing in Kashmir',
    author: 'Sahba Husain',
    year: '2017',
    driveId: '1soBFOJzxUjds6cITZEydQpiKyZWnyZVC',
    description: `An ethnographic account of women's experience of conflict in Kashmir — the decades of military occupation, the disappearances, the torture, and the particular forms of violence that armed conflict inflicts on women's bodies and lives. Husain draws on interviews with women who lost sons and husbands, who survived sexual violence by security forces, and who continue to search for missing family members.

Included here as part of the broader literature on state violence and marginalised communities in India. The experience of Kashmiri Muslims under occupation is analytically connected to the experience of Dalits, Adivasis, and other communities subject to extrajudicial state violence.`,
  },
];

// ── Fetch helper (archive.org) ────────────────────────────────────────────────

async function fetchFromArchive(ids: string[]): Promise<string | null> {
  for (const id of ids) {
    const attempts = [
      `https://archive.org/download/${id}/${id}_djvu.txt`,
      `https://archive.org/download/${id}/${id}.txt`,
    ];
    for (const url of attempts) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
        if (res.ok) {
          const text = await res.text();
          if (text.trim().length > 300) return text;
        }
      } catch { /* try next */ }
    }
    // Metadata-based fallback
    try {
      const meta = await fetch(`https://archive.org/metadata/${id}`, { signal: AbortSignal.timeout(10_000) });
      if (meta.ok) {
        const data = await meta.json() as { files?: { name: string; format: string }[] };
        const txt = data.files?.find(f => f.format === 'DjVuTXT' || (f.format === 'Text' && f.name.endsWith('.txt')));
        if (txt) {
          const res = await fetch(`https://archive.org/download/${id}/${txt.name}`, { signal: AbortSignal.timeout(15_000) });
          if (res.ok) {
            const text = await res.text();
            if (text.trim().length > 300) return text;
          }
        }
      }
    } catch { /* try next id */ }
  }
  return null;
}

function cleanArchiveText(raw: string): string {
  return raw
    .replace(/\f/g, '\n\n')
    .replace(/^\s*(?:[ivxlcdmIVXLCDM]+|\d+)\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n').map(l => l.trimEnd()).join('\n')
    .trim();
}

function textToSegments(
  text: string,
  textId: string,
  slug: string,
): Array<{ textId: string; segmentKey: string; content: string; sequence: number }> {
  return text
    .split(/\n\n+/)
    .map(p => p.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim())
    .filter(p => p.length >= 30)
    .map((content, i) => ({
      textId,
      segmentKey: `${slug}:p${i + 1}`,
      content,
      sequence: i,
    }));
}

// ── Main export ───────────────────────────────────────────────────────────────

interface CollectionDef {
  slug: string;
  name: string;
  tradition: 'THERAVADA' | 'NAVAYANA' | 'MAHAYANA' | 'VAJRAYANA' | 'MULTIPLE' | 'OTHER';
  description: string;
  texts: TextSpec[];
}

const COLLECTIONS: CollectionDef[] = [
  {
    slug: 'gail-omvedt-complete',
    name: 'Gail Omvedt: Buddhism, Caste and Liberation',
    tradition: 'NAVAYANA',
    description: 'The complete works of Gail Omvedt — American-born Indian scholar, activist, and pioneer of Dalit feminist theory. Her writing spans Buddhism in India, Dalit political history, women\'s movements, and anti-caste social movements. PDFs available via the Sangham community Drive folder.',
    texts: OMVEDT,
  },
  {
    slug: 'dalit-memoirs-testimonies',
    name: 'Dalit Lives: Memoirs, Testimonies and Autobiography',
    tradition: 'NAVAYANA',
    description: 'First-person accounts by Dalit writers — memoirs, testimonies, and autobiographies that put the lived experience of caste at the centre. From Vasant Moon\'s Nagpur to Sujatha Gidla\'s Andhra Pradesh, from Baby Kamble\'s village to Yashica Dutt\'s Delhi newsroom.',
    texts: MEMOIRS,
  },
  {
    slug: 'dalit-literature-criticism',
    name: 'Dalit Literature: Criticism, Surveys and Cultural Studies',
    tradition: 'NAVAYANA',
    description: 'Scholarly and critical works on Dalit literary traditions across Indian languages — examining Dalit autobiography, poetry, fiction, and journalism as a field of political and aesthetic practice.',
    texts: DALIT_LITERATURE,
  },
  {
    slug: 'caste-studies-scholarship',
    name: 'Caste, Power, and Liberation: Scholarly Works',
    tradition: 'MULTIPLE',
    description: 'Academic scholarship on caste — its historical origins, its legal and political management, its intersection with gender, disability, queerness, and technology, and its persistence in neoliberal India. Includes works by Anupama Rao, Marc Galanter, Kancha Ilaiah, Suraj Yengde, Gayatri Spivak, and others.',
    texts: CASTE_STUDIES,
  },
  {
    slug: 'ambedkar-historical-political',
    name: 'Ambedkar: Historical and Political Writings',
    tradition: 'NAVAYANA',
    description: 'Historical and political writings by and about Ambedkar — supplementing the core Navayana Buddhist Texts collection with his polemical, historical, and political essays. Includes the Dalit Panthers Manifesto (1972) and the BBC 1955 interview.',
    texts: AMBEDKAR_HISTORICAL,
  },
  {
    slug: 'phule-savitribai-complete',
    name: 'Phule and Savitribai: The Satyshodhak Tradition',
    tradition: 'NAVAYANA',
    description: 'Works by and about Jyotirao Phule and Savitribai Phule — the founders of the Satyashodhak movement and the first school for Dalit and women\'s education in India. The foundational 19th-century tradition from which Ambedkar drew inspiration.',
    texts: PHULE_SAVITRIBAI,
  },
  {
    slug: 'ancient-india-history',
    name: 'Ancient Indian History: Secular and Critical Perspectives',
    tradition: 'OTHER',
    description: 'Historical scholarship on ancient India that challenges the Hindutva rewriting of history — examining India\'s linguistic diversity, religious plurality, Buddhist civilisation, and materialist philosophical traditions.',
    texts: ANCIENT_INDIA,
  },
  {
    slug: 'violence-fascism-communalism',
    name: 'Violence, Fascism and Communalism',
    tradition: 'OTHER',
    description: 'Works examining communal violence, fascism, and state violence — the Gujarat pogrom of 2002, the global history of fascism, and the experience of conflict-affected communities. Comparative reading alongside Dalit literature on caste violence.',
    texts: VIOLENCE_FASCISM,
  },
];

export async function seedDalitLiterature(): Promise<{ seeded: string[]; failed: string[]; total: number }> {
  const seeded: string[] = [];
  const failed: string[] = [];

  for (const collDef of COLLECTIONS) {
    const coll = await prisma.libraryCollection.upsert({
      where:  { slug: collDef.slug },
      create: {
        slug:        collDef.slug,
        name:        collDef.name,
        tradition:   collDef.tradition,
        description: collDef.description,
        sourceUrl:   'https://drive.google.com/drive/folders/1pyCzt7oqkmUq17nRCKXcpQkXKhdVbKur',
        licence:     'MIXED',
      },
      update: {},
    });

    for (const spec of collDef.texts) {
      try {
        let content: string | null = null;

        // Try archive.org for texts with archiveIds
        if (spec.archiveIds?.length) {
          const fetched = await fetchFromArchive(spec.archiveIds);
          if (fetched) content = cleanArchiveText(fetched);
        }

        // Fall back to our written description
        if (!content) content = spec.description;

        const licence = spec.archiveIds?.length && content !== spec.description
          ? ('PUBLIC_DOMAIN' as const)
          : ('CC_BY' as const);

        const dbText = await prisma.libraryText.upsert({
          where:  { externalId: spec.id },
          create: {
            collectionId: coll.id,
            externalId:   spec.id,
            title:        spec.title,
            author:       spec.author,
            language:     'en',
            licence,
            sourceUrl:    driveUrl(spec.driveId),
            attribution:  `${spec.author} (${spec.year})`,
            isSearchable: true,
          },
          update: { title: spec.title, author: spec.author },
        });

        await prisma.librarySegment.deleteMany({ where: { textId: dbText.id } });

        const segments = textToSegments(content, dbText.id, spec.id);

        for (let i = 0; i < segments.length; i += 200) {
          await prisma.librarySegment.createMany({
            data: segments.slice(i, i + 200),
            skipDuplicates: true,
          });
        }

        seeded.push(spec.id);
        console.log(`[Seed] ✓ ${spec.id} — ${segments.length} segments`);
      } catch (err: any) {
        failed.push(`${spec.id}: ${err.message}`);
        console.warn(`[Seed] ✗ ${spec.id}: ${err.message}`);
      }
    }
  }

  return { seeded, failed, total: seeded.length };
}
