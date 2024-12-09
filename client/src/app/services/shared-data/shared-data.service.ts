import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/Game';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SharedDataService {
    playersVictoriesSubject = new BehaviorSubject<Map<string, number>>(new Map());
    private player: Player;
    private accessCode: string = '';
    private matchId: string = '';
    private game: Game;
    private board: Tiles[][];
    private playersInGame: Player[];
    private chatHistory: { user: string; text: string; time: Date }[];
    private isCTF: boolean = false;
    private activePlayer: Player | null = null;
    private playerVictories: Map<string, number>;
    private playerLosses: Map<string, number>;
    private playerCombats: Map<string, number>;
    private playerEscapes: Map<string, number>;
    private playersHpLost: Map<string, number>;
    private playersHpTaken: Map<string, number>;
    private playersObjectCount: Map<string, number>;
    private playersWithFlag: Set<string>;
    private playersTilesVisited: Map<string, { row: number; col: number }[]>;
    private totalTilesVisited: { row: number; col: number }[];
    private totalTurns: number;
    private remainingSpeed: number;
    private gameDuration: { minutes: number; seconds: number };
    private doorsToggled: { row: number; col: number }[];
    private combatInProgressSubject = new BehaviorSubject<boolean>(false);
    combatInProgress$ = this.combatInProgressSubject.asObservable();
    private debugMode$ = new BehaviorSubject<boolean>(false);
    debugModeStatus$ = this.debugMode$.asObservable();

    setChatHistory(messages: { user: string; text: string; time: Date }[]): void {
        this.chatHistory = messages;
    }

    setVictoryMap(victoryMap: Map<string, number>): void {
        this.playerVictories = victoryMap;
    }

    setLossesMap(lossesMap: Map<string, number>): void {
        this.playerLosses = lossesMap;
    }

    setCombatMap(combatMap: Map<string, number>): void {
        this.playerCombats = combatMap;
    }

    setEscapeMap(escapeMap: Map<string, number>): void {
        this.playerEscapes = escapeMap;
    }

    setPointsTakenMap(hpTakenMap: Map<string, number>): void {
        this.playersHpTaken = hpTakenMap;
    }

    setPointsLostMap(hpLostMap: Map<string, number>): void {
        this.playersHpLost = hpLostMap;
    }

    setObjectsCountMap(objectCountMap: Map<string, number>): void {
        this.playersObjectCount = objectCountMap;
    }

    setPlayersWithFlagMap(playersFlagMap: Set<string>): void {
        this.playersWithFlag = playersFlagMap;
    }

    setTilesVisitedMap(tilesVisitedMap: Map<string, { row: number; col: number }[]>): void {
        this.playersTilesVisited = tilesVisitedMap;
    }

    setPlayer(player: Player): void {
        this.player = player;
    }

    setAccessCode(code: string): void {
        this.accessCode = code;
    }

    setMatchId(id: string): void {
        this.matchId = id;
    }

    setGame(gameSelected: Game) {
        this.game = gameSelected;
    }

    setIsCTF(isCTFMode: boolean): void {
        this.isCTF = isCTFMode;
    }

    setTotalTurns(turns: number) {
        this.totalTurns = turns;
    }

    setGameDuration(duration: { minutes: number; seconds: number }) {
        this.gameDuration = duration;
    }

    setBoard(gameBoard: Tiles[][]) {
        this.board = gameBoard;
    }

    setPlayersInGame(players: Player[]) {
        this.playersInGame = players;
    }

    setRemainingSpeed(speed: number) {
        this.remainingSpeed = speed;
    }

    setDoorsToggled(doorsManipulated: { row: number; col: number }[]) {
        this.doorsToggled = doorsManipulated;
    }

    setTotalTilesVisited(tilesVisited: { row: number; col: number }[]): void {
        this.totalTilesVisited = tilesVisited;
    }

    setActivePlayer(player: Player): void {
        this.activePlayer = player;
    }

    getChatHistory(): { user: string; text: string; time: Date }[] {
        return this.chatHistory;
    }

    getVictoryMap(): Map<string, number> {
        return this.playerVictories;
    }

    getLossesMap(): Map<string, number> {
        return this.playerLosses;
    }

    getObjectsCountMap(): Map<string, number> {
        return this.playersObjectCount;
    }

    getPlayersWithFlagMap(): Set<string> {
        return this.playersWithFlag;
    }

    getCombatMap(): Map<string, number> {
        return this.playerCombats;
    }

    getEscapeMap(): Map<string, number> {
        return this.playerEscapes;
    }

    getPointsTakenMap(): Map<string, number> {
        return this.playersHpTaken;
    }

    getPointsLostMap(): Map<string, number> {
        return this.playersHpLost;
    }

    getTilesVisitedMap(): Map<string, { row: number; col: number }[]> {
        return this.playersTilesVisited;
    }

    getPlayer(): Player {
        return this.player;
    }

    getAccessCode(): string {
        return this.accessCode;
    }

    getMatchId(): string {
        return this.matchId;
    }

    getGame(): Game {
        return this.game;
    }

    getIsCTF(): boolean {
        return this.isCTF;
    }

    getTotalTurns(): number {
        return this.totalTurns;
    }

    getGameDuration(): { minutes: number; seconds: number } {
        return this.gameDuration;
    }

    getBoard(): Tiles[][] {
        return this.board;
    }

    getPlayersInGame() {
        return this.playersInGame;
    }

    getRemainingSpeed(): number {
        return this.remainingSpeed;
    }

    getDoorsToggled(): { row: number; col: number }[] {
        return this.doorsToggled;
    }

    getTotalTilesVisited(): { row: number; col: number }[] {
        return this.totalTilesVisited;
    }

    getActivePlayer(): Player | null {
        return this.activePlayer;
    }

    clearActivePlayer(): void {
        this.activePlayer = null;
    }

    setCombatInProgress(status: boolean): void {
        this.combatInProgressSubject.next(status);
    }

    setDebugModeStatus(status: boolean): void {
        this.debugMode$.next(status);
    }

    getDebugModeStatus(): boolean {
        return this.debugMode$.getValue();
    }

    resetSharedServices(): void {
        this.setVictoryMap(new Map<string, number>());
        this.setLossesMap(new Map<string, number>());
        this.setCombatMap(new Map<string, number>());
        this.setEscapeMap(new Map<string, number>());
        this.setPointsTakenMap(new Map<string, number>());
        this.setPointsLostMap(new Map<string, number>());
        this.setObjectsCountMap(new Map<string, number>());
        this.setTilesVisitedMap(new Map<string, { row: number; col: number }[]>());
        this.setPlayer({
            username: '',
            character: {
                name: '',
                image: '',
                face: '',
                body: '',
                stats: {
                    health: 0,
                    speed: 0,
                    attack: 0,
                    defense: 0,
                },
                dice: '',
                victories: 0,
                disabled: false,
                position: null,
                initialPosition: null,
            },
            isAdmin: false,
            inventory: [null, null],
        });
        this.setAccessCode('');
        this.setMatchId('');
        this.setGame({
            _id: '',
            title: '',
            mapSize: '',
            mode: '',
            visibility: false,
            description: '',
            board: [],
            updatedAt: new Date(),
        });
        this.setTotalTurns(0);
        this.setGameDuration({ minutes: 0, seconds: 0 });
        this.setBoard([]);
        this.setPlayersInGame([]);
        this.setDoorsToggled([]);
        this.setTotalTilesVisited([]);
        this.setDebugModeStatus(false);
        this.setCombatInProgress(false);
        this.clearActivePlayer();
        this.setChatHistory([]);
    }
}
