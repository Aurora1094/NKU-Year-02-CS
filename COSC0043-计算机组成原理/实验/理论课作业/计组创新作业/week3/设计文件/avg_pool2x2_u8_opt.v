module avg_pool2x2_u8_opt (
    input [7:0] a,
    input [7:0] b,
    input [7:0] c,
    input [7:0] d,
    output [7:0] y
);

wire [9:0] sum;

assign sum = {2'b00, a} + {2'b00, b} + {2'b00, c} + {2'b00, d};
assign y = sum >> 2;

endmodule