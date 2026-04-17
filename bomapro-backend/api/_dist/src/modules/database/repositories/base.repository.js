"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const common_1 = require("@nestjs/common");
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    async create(data) {
        try {
            const entity = new this.model(data);
            return await entity.save();
        }
        catch (error) {
            if (error.code === 11000) {
                throw new common_1.ConflictException(`Duplicate key error: ${error.message}`);
            }
            throw new common_1.InternalServerErrorException(`Failed to create entity: ${error.message}`);
        }
    }
    async findById(id) {
        return this.model.findById(id).exec();
    }
    async findAll() {
        return this.model.find({ isDeleted: false }).exec();
    }
    async findOne(filter) {
        return this.model.findOne({ ...filter, isDeleted: false }).exec();
    }
    async findBy(filter) {
        return this.model.find({ ...filter, isDeleted: false }).exec();
    }
    async update(id, data) {
        return this.model
            .findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true })
            .exec();
    }
    async delete(id) {
        const result = await this.model
            .findByIdAndUpdate(id, { isDeleted: true, updatedAt: new Date() })
            .exec();
        return !!result;
    }
    async findPaginated(options = {}) {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', filter = {}, } = options;
        const skip = (page - 1) * limit;
        const baseFilter = { ...filter, isDeleted: false };
        const [total, data] = await Promise.all([
            this.model.countDocuments(baseFilter),
            this.model
                .find(baseFilter)
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map