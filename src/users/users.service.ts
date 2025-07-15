import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/User";
import { Oops } from "../common/exection";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: { username: string }) {
    if (!dto.username) throw Oops("Username is required");
    const checkUser = await this.userRepository.findOne({ where: { username: dto.username } });

    if (checkUser) throw Oops(`User with username ${dto.username} already exists`);
    await this.userRepository.save(this.userRepository.create(dto));
  }

  async login(dto: { username: string }): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findOne({ where: { username: dto.username } });
    if (!user) throw Oops(`User with username ${dto.username} not found`);
    const accessToken = await this.jwtService.signAsync({ sub: user.id, username: user.username });
    return { accessToken };
  }

  async getById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id }, relations: ["notifications"] });
    if (!user) throw Oops(`User with ID ${id} not found`);
    return user;
  }
}
